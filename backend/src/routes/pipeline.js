import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT * FROM pipeline WHERE user_id = ? ORDER BY updated_at DESC`
    ).all(req.user.id);
    res.json({ pipeline: rows });
  } catch (err) {
    console.error('Get pipeline error:', err);
    res.status(500).json({ error: '获取管道失败' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { customer_id, customer_name, stage, amount, probability, expected_close, notes } = req.body;
    const row = db.prepare(
      `INSERT INTO pipeline (user_id, customer_id, customer_name, stage, amount, probability, expected_close, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).get(req.user.id, customer_id || null, customer_name || '', stage || 'lead', amount || 0, probability || 0, expected_close || '', notes || '');

    res.status(201).json({ deal: row });
  } catch (err) {
    console.error('Create pipeline deal error:', err);
    res.status(500).json({ error: '创建交易失败' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM pipeline WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: '交易不存在' });

    const b = req.body;
    const row = db.prepare(
      `UPDATE pipeline SET customer_name=?, stage=?, amount=?, probability=?, expected_close=?, notes=?, updated_at=datetime('now')
       WHERE id=? AND user_id=? RETURNING *`
    ).get(
      b.customer_name ?? existing.customer_name, b.stage ?? existing.stage,
      b.amount ?? existing.amount, b.probability ?? existing.probability,
      b.expected_close ?? existing.expected_close, b.notes ?? existing.notes,
      req.params.id, req.user.id
    );

    res.json({ deal: row });
  } catch (err) {
    console.error('Update pipeline deal error:', err);
    res.status(500).json({ error: '更新交易失败' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM pipeline WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: '交易不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除交易失败' });
  }
});

router.get('/forecast', auth, (req, res) => {
  try {
    const deals = db.prepare(
      `SELECT stage, amount, probability FROM pipeline WHERE user_id = ? AND stage != 'closed'`
    ).all(req.user.id);

    let totalForecast = 0;
    const stageForecast = { lead: 0, interested: 0, quoted: 0, negotiating: 0 };

    for (const d of deals) {
      const forecast = (d.amount || 0) * (d.probability || 0);
      totalForecast += forecast;
      if (stageForecast[d.stage] !== undefined) {
        stageForecast[d.stage] += forecast;
      }
    }

    res.json({
      forecast: Math.round(totalForecast * 100) / 100,
      deals: deals.length,
      byStage: stageForecast,
    });
  } catch (err) {
    console.error('Pipeline forecast error:', err);
    res.status(500).json({ error: '获取预测数据失败' });
  }
});

export default router;

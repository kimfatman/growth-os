import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import { analyzeTarget } from '../ai.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const row = db.prepare(
      `SELECT * FROM targets WHERE user_id = ? AND month = ?`
    ).get(req.user.id, month);

    const currentRevenue = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM customers WHERE user_id = ? AND status = '成交' AND updated_at >= ?`
    ).get(req.user.id, `${month}-01`);

    res.json({
      target: row || null,
      current_revenue: Number(currentRevenue.total),
    });
  } catch (err) {
    console.error('Get target error:', err);
    res.status(500).json({ error: '获取目标失败' });
  }
});

router.post('/analyze', auth, async (req, res) => {
  try {
    const { target_amount } = req.body;

    if (!target_amount || target_amount <= 0) {
      return res.status(400).json({ error: '请输入有效的目标金额' });
    }

    const month = new Date().toISOString().slice(0, 7);
    const breakdown = await analyzeTarget(target_amount);

    db.prepare(
      `INSERT INTO targets (user_id, target_amount, month, ai_breakdown)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, month) DO UPDATE SET
         target_amount = excluded.target_amount,
         ai_breakdown = excluded.ai_breakdown,
         updated_at = datetime('now')`
    ).run(req.user.id, target_amount, month, JSON.stringify(breakdown));

    const currentRevenue = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM customers WHERE user_id = ? AND status = '成交' AND updated_at >= ?`
    ).get(req.user.id, `${month}-01`);

    res.json({
      breakdown,
      target_amount,
      current_revenue: Number(currentRevenue.total),
    });
  } catch (err) {
    console.error('Analyze target error:', err);
    res.status(500).json({ error: '目标分析失败' });
  }
});

export default router;

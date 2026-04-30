import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import { analyzeTarget } from '../ai.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const { rows } = await db.query(
      `SELECT * FROM targets WHERE user_id = $1 AND month = $2`,
      [req.user.id, month]
    );

    const { rows: currentRevenue } = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM customers WHERE user_id = $1 AND status = '成交' AND updated_at >= $2`,
      [req.user.id, `${month}-01`]
    );

    res.json({
      target: rows[0] || null,
      current_revenue: Number(currentRevenue[0].total),
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

    await db.query(
      `INSERT INTO targets (user_id, target_amount, month, ai_breakdown)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, month)
       DO UPDATE SET target_amount = $2, ai_breakdown = $4, updated_at = NOW()
       RETURNING *`,
      [req.user.id, target_amount, month, JSON.stringify(breakdown)]
    );

    const { rows: currentRevenue } = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM customers WHERE user_id = $1 AND status = '成交' AND updated_at >= $2`,
      [req.user.id, `${month}-01`]
    );

    res.json({
      breakdown,
      target_amount,
      current_revenue: Number(currentRevenue[0].total),
    });
  } catch (err) {
    console.error('Analyze target error:', err);
    res.status(500).json({ error: '目标分析失败' });
  }
});

export default router;

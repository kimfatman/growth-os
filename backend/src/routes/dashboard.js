import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, (req, res) => {
  try {
    let row = db.prepare('SELECT * FROM dashboard WHERE user_id = ?').get(req.user.id);

    if (!row) {
      // Auto-generate dashboard stats
      const stats = db.prepare(
        `SELECT
          COUNT(*) as total_customers,
          COALESCE(SUM(CASE WHEN status = '成交' THEN amount ELSE 0 END), 0) as total_revenue,
          COUNT(CASE WHEN status = '成交' THEN 1 END) as closed_deals,
          COUNT(CASE WHEN status != '成交' AND status != '线索' THEN 1 END) as active_deals
        FROM customers WHERE user_id = ?`
      ).get(req.user.id);

      const todayRevenue = db.prepare(
        `SELECT COALESCE(SUM(amount), 0) as rev FROM customers
         WHERE user_id = ? AND status = '成交' AND updated_at >= date('now')`
      ).get(req.user.id);

      const highValue = db.prepare(
        `SELECT COUNT(*) as cnt FROM customers WHERE user_id = ? AND score >= 80`
      ).get(req.user.id);

      const riskCount = db.prepare(
        `SELECT COUNT(*) as cnt FROM customers WHERE user_id = ? AND (risk = 1 OR needs_attention = 1)`
      ).get(req.user.id);

      const pipelineValue = db.prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM pipeline WHERE user_id = ? AND stage != 'closed'`
      ).get(req.user.id);

      row = {
        revenue_today: Number(todayRevenue.rev),
        conversion_rate: stats.total_customers > 0 ? stats.closed_deals / stats.total_customers : 0,
        high_value_customers: highValue.cnt,
        risk_customers: riskCount.cnt,
        forecast_amount: Number(pipelineValue.total),
        active_deals: stats.active_deals,
        new_leads_today: 0,
      };
    }

    res.json({ dashboard: row });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ error: '获取仪表盘失败' });
  }
});

export default router;

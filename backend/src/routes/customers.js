import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import { addXp, updateTaskProgress, updateStreak } from '../gamification.js';

function calculateCustomerScore(customerId, userId) {
  const timeline = db.prepare(
    `SELECT COUNT(*) as cnt FROM timeline WHERE customer_id = ? AND user_id = ? AND created_at >= datetime('now', '-30 days')`
  ).get(customerId, userId);

  const lastTimeline = db.prepare(
    `SELECT created_at FROM timeline WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1`
  ).get(customerId);

  const maxAmount = db.prepare(
    `SELECT COALESCE(MAX(amount), 1) as max_amt FROM customers WHERE user_id = ?`
  ).get(userId);

  const closedCount = db.prepare(
    `SELECT COUNT(*) as cnt FROM customers WHERE user_id = ? AND status = '成交'`
  ).get(userId);

  const customer = db.prepare('SELECT amount FROM customers WHERE id = ?').get(customerId);
  if (!customer) return 0;

  const followUpFreq = Math.min((timeline.cnt || 0) / 10 * 100, 100);
  const daysSinceLast = lastTimeline
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(lastTimeline.created_at).getTime()) / 86400000))
    : 0;
  const recentInteraction = Math.min(daysSinceLast / 30 * 100, 100);
  const amountScore = Math.min((customer.amount || 0) / (maxAmount || 1) * 100, 100);
  const dealHistory = Math.min((closedCount || 0) / 20 * 100, 100);

  return Math.round(followUpFreq * 0.3 + recentInteraction * 0.3 + amountScore * 0.2 + dealHistory * 0.2);
}

const router = Router();

router.get('/', auth, (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM customers WHERE user_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY updated_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json({ customers: rows });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ error: '获取客户列表失败' });
  }
});

router.get('/stats', auth, (req, res) => {
  try {
    const row = db.prepare(
      `SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status != '成交' THEN amount ELSE 0 END), 0) as pipeline_value,
        COUNT(CASE WHEN status = '成交' THEN 1 END) as closed_deals,
        COUNT(CASE WHEN status = '意向' THEN 1 END) as intent,
        COUNT(CASE WHEN status = '谈判' THEN 1 END) as negotiation
      FROM customers WHERE user_id = ?`
    ).get(req.user.id);

    const todayRevenue = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as revenue
       FROM customers WHERE user_id = ? AND status = '成交' AND updated_at >= date('now')`
    ).get(req.user.id);

    res.json({ stats: { ...row, today_revenue: todayRevenue.revenue } });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, company, phone, status, amount, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: '客户名称不能为空' });
    }

    const row = db.prepare(
      `INSERT INTO customers (user_id, name, company, phone, status, amount, notes, score)
       VALUES (?, ?, ?, ?, ?, ?, ?, 50)
       RETURNING *`
    ).get(req.user.id, name, company || '', phone || '', status || '线索', amount || 0, notes || '');

    const score = calculateCustomerScore(row.id, req.user.id);
    db.prepare('UPDATE customers SET score = ? WHERE id = ?').run(score, row.id);
    row.score = score;

    const xpResult = addXp(req.user.id, 'new_customer');
    updateTaskProgress(req.user.id, 'new_customer');
    updateStreak(req.user.id);

    res.status(201).json({ customer: row, xp: xpResult });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: '新增客户失败' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, phone, status, amount, notes } = req.body;

    const existing = db.prepare(
      'SELECT * FROM customers WHERE id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: '客户不存在' });
    }

    const oldStatus = existing.status;
    let xpResult = null;

    const row = db.prepare(
      `UPDATE customers
       SET name = ?, company = ?, phone = ?, status = ?, amount = ?, notes = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?
       RETURNING *`
    ).get(
      name || existing.name,
      company !== undefined ? company : existing.company,
      phone !== undefined ? phone : existing.phone,
      status || existing.status,
      amount !== undefined ? amount : existing.amount,
      notes !== undefined ? notes : existing.notes,
      id,
      req.user.id
    );

    if (status && status !== oldStatus) {
      xpResult = addXp(req.user.id, 'advance_stage');
      updateTaskProgress(req.user.id, 'advance_stage');
      updateStreak(req.user.id);

      if (status === '成交') {
        xpResult = addXp(req.user.id, 'close_deal');
      }
    }

    const score = calculateCustomerScore(row.id, req.user.id);
    db.prepare('UPDATE customers SET score = ? WHERE id = ?').run(score, row.id);
    row.score = score;

    res.json({ customer: row, xp: xpResult });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: '更新客户失败' });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const row = db.prepare(
      'SELECT * FROM customers WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!row) {
      return res.status(404).json({ error: '客户不存在' });
    }

    res.json({ customer: row });
  } catch (err) {
    res.status(500).json({ error: '获取客户详情失败' });
  }
});

export default router;

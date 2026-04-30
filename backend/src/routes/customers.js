import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import { addXp, updateTaskProgress, updateStreak } from '../gamification.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM customers WHERE user_id = $1';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR company ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY updated_at DESC';

    const { rows } = await db.query(query, params);
    res.json({ customers: rows });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ error: '获取客户列表失败' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status != '成交' THEN amount ELSE 0 END), 0) as pipeline_value,
        COUNT(CASE WHEN status = '成交' THEN 1 END) as closed_deals,
        COUNT(CASE WHEN status = '意向' THEN 1 END) as intent,
        COUNT(CASE WHEN status = '谈判' THEN 1 END) as negotiation
      FROM customers WHERE user_id = $1`,
      [req.user.id]
    );

    const { rows: todayRevenue } = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as revenue
       FROM customers WHERE user_id = $1 AND status = '成交' AND updated_at >= CURRENT_DATE`,
      [req.user.id]
    );

    res.json({ stats: { ...rows[0], today_revenue: todayRevenue[0].revenue } });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, company, phone, status, amount, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: '客户名称不能为空' });
    }

    const { rows } = await db.query(
      `INSERT INTO customers (user_id, name, company, phone, status, amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, name, company || '', phone || '', status || '线索', amount || 0, notes || '']
    );

    const xpResult = await addXp(req.user.id, 'new_customer');
    await updateTaskProgress(req.user.id, 'new_customer');
    await updateStreak(req.user.id);

    res.status(201).json({ customer: rows[0], xp: xpResult });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: '新增客户失败' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, phone, status, amount, notes } = req.body;

    const { rows: existing } = await db.query(
      'SELECT * FROM customers WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: '客户不存在' });
    }

    const oldStatus = existing[0].status;
    let xpResult = null;

    const { rows } = await db.query(
      `UPDATE customers
       SET name = $1, company = $2, phone = $3, status = $4, amount = $5, notes = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        name || existing[0].name,
        company !== undefined ? company : existing[0].company,
        phone !== undefined ? phone : existing[0].phone,
        status || existing[0].status,
        amount !== undefined ? amount : existing[0].amount,
        notes !== undefined ? notes : existing[0].notes,
        id,
        req.user.id,
      ]
    );

    if (status && status !== oldStatus) {
      xpResult = await addXp(req.user.id, 'advance_stage');
      await updateTaskProgress(req.user.id, 'advance_stage');
      await updateStreak(req.user.id);

      if (status === '成交') {
        const dealXp = await addXp(req.user.id, 'close_deal');
        xpResult = dealXp;
      }
    }

    res.json({ customer: rows[0], xp: xpResult });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: '更新客户失败' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM customers WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: '客户不存在' });
    }

    res.json({ customer: rows[0] });
  } catch (err) {
    res.status(500).json({ error: '获取客户详情失败' });
  }
});

export default router;

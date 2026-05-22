import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import { addXp, updateTaskProgress, updateStreak } from '../gamification.js';

const router = Router();

router.get('/customer/:customerId', auth, (req, res) => {
  try {
    const customer = db.prepare(
      'SELECT id, user_id FROM customers WHERE id = ?'
    ).get(req.params.customerId);

    if (!customer || customer.user_id !== req.user.id) {
      return res.status(404).json({ error: '客户不存在' });
    }

    const rows = db.prepare(
      `SELECT t.*, c.name as customer_name
       FROM timeline t
       JOIN customers c ON c.id = t.customer_id
       WHERE t.customer_id = ?
       ORDER BY t.created_at DESC`
    ).all(req.params.customerId);

    res.json({ records: rows });
  } catch (err) {
    console.error('Get timeline error:', err);
    res.status(500).json({ error: '获取时间轴失败' });
  }
});

router.get('/recent', auth, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT t.*, c.name as customer_name, c.company as customer_company
       FROM timeline t
       JOIN customers c ON c.id = t.customer_id
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC
       LIMIT 50`
    ).all(req.user.id);

    res.json({ records: rows });
  } catch (err) {
    console.error('Get recent timeline error:', err);
    res.status(500).json({ error: '获取时间轴失败' });
  }
});

router.get('/grouped', auth, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT t.*, c.name as customer_name, c.company as customer_company
       FROM timeline t
       JOIN customers c ON c.id = t.customer_id
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC
       LIMIT 100`
    ).all(req.user.id);

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const groups = { today: [], yesterday: [], earlier: [] };

    for (const r of rows) {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (date === today) groups.today.push(r);
      else if (date === yesterday) groups.yesterday.push(r);
      else groups.earlier.push(r);
    }

    res.json({ groups });
  } catch (err) {
    console.error('Get grouped timeline error:', err);
    res.status(500).json({ error: '获取时间轴失败' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { customer_id, type, content } = req.body;

    if (!customer_id || !type || !content) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const customer = db.prepare(
      'SELECT id, user_id, name FROM customers WHERE id = ?'
    ).get(customer_id);

    if (!customer || customer.user_id !== req.user.id) {
      return res.status(404).json({ error: '客户不存在' });
    }

    const row = db.prepare(
      `INSERT INTO timeline (customer_id, user_id, type, content)
       VALUES (?, ?, ?, ?)
       RETURNING *`
    ).get(customer_id, req.user.id, type, content);

    const xpResult = addXp(req.user.id, 'record_timeline');
    updateTaskProgress(req.user.id, 'follow_up');
    updateStreak(req.user.id);

    res.status(201).json({ record: row, xp: xpResult });
  } catch (err) {
    console.error('Create timeline error:', err);
    res.status(500).json({ error: '记录沟通失败' });
  }
});

export default router;

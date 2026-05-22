import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products WHERE user_id = ?';
    const params = [req.user.id];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json({ products: rows });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: '获取产品列表失败' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, price, category, description, service_content, target_customer, duration, profit_margin } = req.body;
    if (!name) return res.status(400).json({ error: '产品名称不能为空' });

    const row = db.prepare(
      `INSERT INTO products (user_id, name, price, category, description, service_content, target_customer, duration, profit_margin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).get(req.user.id, name, price || 0, category || '', description || '', service_content || '', target_customer || '', duration || '', profit_margin || 0);

    res.status(201).json({ product: row });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: '添加产品失败' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: '产品不存在' });

    const b = req.body;
    const row = db.prepare(
      `UPDATE products SET name=?, price=?, category=?, description=?, service_content=?, target_customer=?, duration=?, profit_margin=? WHERE id=? AND user_id=?
       RETURNING *`
    ).get(
      b.name || existing.name, b.price ?? existing.price, b.category ?? existing.category,
      b.description ?? existing.description, b.service_content ?? existing.service_content,
      b.target_customer ?? existing.target_customer, b.duration ?? existing.duration,
      b.profit_margin ?? existing.profit_margin, req.params.id, req.user.id
    );

    res.json({ product: row });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: '更新产品失败' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: '产品不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除产品失败' });
  }
});

router.post('/import', auth, (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: '请提供产品数组' });
    }

    const insert = db.prepare(
      `INSERT INTO products (user_id, name, price, category, description, service_content, target_customer, duration, profit_margin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`
    );

    const imported = [];
    for (const p of products) {
      if (!p.name) continue;
      const row = insert.get(
        req.user.id, p.name, p.price || 0, p.category || '', p.description || '',
        p.service_content || '', p.target_customer || '', p.duration || '', p.profit_margin || 0
      );
      imported.push(row);
    }

    res.status(201).json({ products: imported, count: imported.length });
  } catch (err) {
    console.error('Import products error:', err);
    res.status(500).json({ error: '批量导入产品失败' });
  }
});

export default router;

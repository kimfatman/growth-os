import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, (req, res) => {
  try {
    const { platform, type, search } = req.query;
    let query = 'SELECT * FROM content WHERE user_id = ?';
    const params = [req.user.id];

    if (platform) { query += ' AND platform = ?'; params.push(platform); }
    if (type) { query += ' AND type = ?'; params.push(type); }
    if (search) { query += ' AND title LIKE ?'; params.push(`%${search}%`); }

    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json({ content: rows });
  } catch (err) {
    console.error('Get content error:', err);
    res.status(500).json({ error: '获取内容失败' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { title, platform, type, tags, status } = req.body;
    if (!title) return res.status(400).json({ error: '内容标题不能为空' });

    const row = db.prepare(
      `INSERT INTO content (user_id, title, platform, type, tags, status)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).get(req.user.id, title, platform || '', type || 'article', JSON.stringify(tags || []), status || 'draft');

    res.status(201).json({ content: row });
  } catch (err) {
    console.error('Create content error:', err);
    res.status(500).json({ error: '创建内容失败' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM content WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: '内容不存在' });

    const b = req.body;
    const row = db.prepare(
      `UPDATE content SET title=?, platform=?, type=?, tags=?, status=?
       WHERE id=? AND user_id=? RETURNING *`
    ).get(
      b.title ?? existing.title, b.platform ?? existing.platform, b.type ?? existing.type,
      b.tags ? JSON.stringify(b.tags) : existing.tags, b.status ?? existing.status,
      req.params.id, req.user.id
    );

    res.json({ content: row });
  } catch (err) {
    console.error('Update content error:', err);
    res.status(500).json({ error: '更新内容失败' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM content WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: '内容不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除内容失败' });
  }
});

export default router;

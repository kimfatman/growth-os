import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import { getXpInfo, getTasks, checkAchievements } from '../gamification.js';

const router = Router();

router.get('/xp', auth, (req, res) => {
  try {
    const xp = getXpInfo(req.user.id);
    res.json(xp);
  } catch (err) {
    console.error('Get XP error:', err);
    res.status(500).json({ error: '获取经验值失败' });
  }
});

router.get('/tasks', auth, (req, res) => {
  try {
    const tasks = getTasks(req.user.id);
    res.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: '获取任务失败' });
  }
});

router.get('/achievements', auth, (req, res) => {
  try {
    const achievements = checkAchievements(req.user.id);
    res.json({ achievements });
  } catch (err) {
    console.error('Get achievements error:', err);
    res.status(500).json({ error: '获取成就失败' });
  }
});

router.get('/xp-log', auth, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT * FROM xp_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).all(req.user.id);
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: '获取经验记录失败' });
  }
});

export default router;

import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import {
  getXpInfo,
  getTasks,
  checkAchievements,
} from '../gamification.js';

const router = Router();

router.get('/xp', auth, async (req, res) => {
  try {
    const xp = await getXpInfo(req.user.id);
    res.json(xp);
  } catch (err) {
    console.error('Get XP error:', err);
    res.status(500).json({ error: '获取经验值失败' });
  }
});

router.get('/tasks', auth, async (req, res) => {
  try {
    const tasks = await getTasks(req.user.id);
    res.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: '获取任务失败' });
  }
});

router.get('/achievements', auth, async (req, res) => {
  try {
    const achievements = await checkAchievements(req.user.id);
    res.json({ achievements });
  } catch (err) {
    console.error('Get achievements error:', err);
    res.status(500).json({ error: '获取成就失败' });
  }
});

router.get('/xp-log', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM xp_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: '获取经验记录失败' });
  }
});

export default router;

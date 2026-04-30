import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import { getSuggestions } from '../ai.js';

const router = Router();

router.get('/suggestions', auth, async (req, res) => {
  try {
    const { rows: customers } = await db.query(
      `SELECT id, name, company, status, amount
       FROM customers
       WHERE user_id = $1 AND status != '成交'
       ORDER BY
         CASE status
           WHEN '谈判' THEN 1
           WHEN '意向' THEN 2
           WHEN '线索' THEN 3
           ELSE 4
         END,
         amount DESC
       LIMIT 20`,
      [req.user.id]
    );

    const result = await getSuggestions(customers);

    res.json({
      suggestions: result.suggestions || [],
      summary: result.summary || '',
      customers,
    });
  } catch (err) {
    console.error('AI suggestions error:', err);
    res.status(500).json({ error: '获取AI建议失败' });
  }
});

export default router;

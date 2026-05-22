import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import { getSuggestions, generateContent, analyzeCustomer, recommendProducts, generateScript } from '../ai.js';

const router = Router();

router.get('/suggestions', auth, async (req, res) => {
  try {
    const customers = db.prepare(
      `SELECT id, name, company, status, amount
       FROM customers
       WHERE user_id = ? AND status != '成交'
       ORDER BY
         CASE status
           WHEN '谈判' THEN 1
           WHEN '意向' THEN 2
           WHEN '线索' THEN 3
           ELSE 4
         END,
         amount DESC
       LIMIT 20`
    ).all(req.user.id);

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

router.post('/generate-content', auth, async (req, res) => {
  try {
    const { platform, topic, style } = req.body;
    if (!platform || !topic) {
      return res.status(400).json({ error: 'platform和topic为必填参数' });
    }
    const result = await generateContent(platform, topic, style);
    res.json(result);
  } catch (err) {
    console.error('Generate content error:', err);
    res.status(500).json({ error: '内容生成失败' });
  }
});

router.post('/analyze-customer', auth, async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId为必填参数' });
    }

    const customer = db.prepare(
      'SELECT * FROM customers WHERE id = ? AND user_id = ?'
    ).get(customerId, req.user.id);

    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }

    const timeline = db.prepare(
      'SELECT * FROM timeline WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(customerId);

    const result = await analyzeCustomer(customer, timeline);
    res.json(result);
  } catch (err) {
    console.error('Analyze customer error:', err);
    res.status(500).json({ error: '客户分析失败' });
  }
});

router.post('/recommend-products', auth, async (req, res) => {
  try {
    const { leadId, customerId } = req.body;

    let targetData;
    if (leadId) {
      targetData = db.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').get(leadId, req.user.id);
    } else if (customerId) {
      targetData = db.prepare('SELECT * FROM customers WHERE id = ? AND user_id = ?').get(customerId, req.user.id);
    }

    if (!targetData) {
      return res.status(400).json({ error: '请提供有效的leadId或customerId' });
    }

    const products = db.prepare('SELECT * FROM products WHERE user_id = ?').all(req.user.id);
    const result = await recommendProducts(targetData, products);
    res.json(result);
  } catch (err) {
    console.error('Recommend products error:', err);
    res.status(500).json({ error: '产品推荐失败' });
  }
});

router.post('/generate-script', auth, async (req, res) => {
  try {
    const { scenario, context } = req.body;
    if (!scenario) {
      return res.status(400).json({ error: 'scenario为必填参数' });
    }
    const result = await generateScript(scenario, context || {});
    res.json(result);
  } catch (err) {
    console.error('Generate script error:', err);
    res.status(500).json({ error: '话术生成失败' });
  }
});

export default router;

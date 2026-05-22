import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();

function analyzeLeadLocally(message, platform) {
  const intentPatterns = [
    { intent: 'qualification', keywords: ['认定', '申报', '资质', '专精特新', '高新', '项目申报'] },
    { intent: 'tax', keywords: ['税务', '税收', '筹划', '税', '发票', '报税'] },
    { intent: 'subsidy', keywords: ['补贴', '政府', '扶持', '资金', '补助', '奖励'] },
    { intent: 'ip', keywords: ['商标', '专利', '知识产权', '版权', '注册', '申请'] },
  ];

  let detectedIntent = 'general';
  let maxScore = 0;
  for (const pattern of intentPatterns) {
    let hits = 0;
    for (const kw of pattern.keywords) {
      if (message.includes(kw)) hits++;
    }
    if (hits > maxScore) { maxScore = hits; detectedIntent = pattern.intent; }
  }

  const urgencyWords = ['急', '快', '马上', '立即', '加急', '尽快', '紧急'];
  const hasUrgency = urgencyWords.some(w => message.includes(w));
  const hasCompany = message.includes('公司') || message.includes('企业');
  const length = message.length;

  let score = 50;
  if (detectedIntent !== 'general') score += 20;
  if (hasUrgency) score += 15;
  if (hasCompany) score += 10;
  if (length > 30) score += 5;

  score = Math.min(score, 100);

  const intentLabels = { qualification: '资质申报', tax: '税务咨询', subsidy: '补贴申请', ip: '知识产权', general: '通用咨询' };

  const replyTemplates = {
    qualification: '感谢您的咨询！关于资质申报，我们已帮助上百家企业成功拿证。方便私信您的企业信息，我为您做个免费评估吗？',
    tax: '您好！税收政策确实比较复杂，我们提供一对一税务筹划服务。您方便留个联系方式，我们的专家为您详细解答吗？',
    subsidy: '感谢关注！目前政府补贴项目很多，关键是要匹配企业条件。私信我公司信息，帮您筛选适合的补贴项目。',
    ip: '了解！知识产权保护非常重要。我们可以帮您做全面的检索分析，确保申请顺利。需要进一步了解吗？',
    general: '感谢您的留言！我们提供一站式企业服务解决方案。方便告诉我更多需求细节吗？',
  };

  return {
    intent: detectedIntent,
    intentLabel: intentLabels[detectedIntent] || '通用咨询',
    score,
    keywords: intentPatterns.find(p => p.intent === detectedIntent)?.keywords || [],
    suggestedReply: replyTemplates[detectedIntent] || replyTemplates.general,
  };
}

router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC`
    ).all(req.user.id);
    res.json({ leads: rows });
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ error: '获取线索失败' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, platform, message, intent, score, status, industry } = req.body;
    const row = db.prepare(
      `INSERT INTO leads (user_id, name, platform, message, intent, score, status, industry)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).get(req.user.id, name, platform || '', message || '', intent || '', score || 0, status || 'pending', industry || '');

    res.status(201).json({ lead: row });
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ error: '创建线索失败' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: '线索不存在' });

    const b = req.body;
    const row = db.prepare(
      `UPDATE leads SET name=?, platform=?, message=?, intent=?, score=?, status=?, industry=?
       WHERE id=? AND user_id=? RETURNING *`
    ).get(
      b.name ?? existing.name, b.platform ?? existing.platform, b.message ?? existing.message,
      b.intent ?? existing.intent, b.score ?? existing.score, b.status ?? existing.status,
      b.industry ?? existing.industry, req.params.id, req.user.id
    );

    res.json({ lead: row });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ error: '更新线索失败' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM leads WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: '线索不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除线索失败' });
  }
});

router.post('/analyze', auth, (req, res) => {
  try {
    const { message, platform, leadId } = req.body;

    let leadData = {};
    if (leadId) {
      const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').get(leadId, req.user.id);
      if (!lead) return res.status(404).json({ error: '线索不存在' });
      leadData = lead;
    }

    const msg = message || leadData.message || '';
    const plat = platform || leadData.platform || '';

    if (!msg) return res.status(400).json({ error: '请提供message或leadId' });

    const analysis = analyzeLeadLocally(msg, plat);

    if (leadId) {
      db.prepare('UPDATE leads SET intent = ?, score = ? WHERE id = ? AND user_id = ?')
        .run(analysis.intent, analysis.score, leadId, req.user.id);
    }

    res.json(analysis);
  } catch (err) {
    console.error('Analyze lead error:', err);
    res.status(500).json({ error: '线索分析失败' });
  }
});

export default router;

import dotenv from 'dotenv';
dotenv.config();

const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';

async function callLLM(systemPrompt, userPrompt) {
  if (!AI_API_KEY) {
    return mockLLM(systemPrompt, userPrompt);
  }

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('AI call failed, using fallback:', err.message);
    return mockLLM(systemPrompt, userPrompt);
  }
}

function mockLLM(systemPrompt, userPrompt) {
  if (userPrompt.includes('target') || userPrompt.includes('目标')) {
    const match = userPrompt.match(/(\d+)/);
    const amount = match ? parseInt(match[1]) : 1000000;
    const avgDeal = 80000;
    const dealsNeeded = Math.ceil(amount / avgDeal);
    const leadsNeeded = Math.ceil(dealsNeeded / 0.2);
    const intentNeeded = Math.ceil(dealsNeeded / 0.4);

    return JSON.stringify({
      targetAmount: amount,
      dealsNeeded,
      leadsNeeded,
      intentNeeded,
      negotiationNeeded: Math.ceil(dealsNeeded / 0.6),
      avgDealSize: avgDeal,
      suggestion: `根据历史数据，平均成交价约 ¥${(avgDeal/10000).toFixed(1)}万。建议本月聚焦 ${leadsNeeded} 条线索，其中 ${intentNeeded} 个进入意向阶段，最终完成 ${dealsNeeded} 单成交。`,
    });
  }

  if (userPrompt.includes('suggest') || userPrompt.includes('建议')) {
    return JSON.stringify({
      suggestions: [
        { customerName: '张伟', priority: '高', action: '今日跟进，重点沟通方案报价', reason: '处于谈判阶段，转化概率高' },
        { customerName: '李娜', priority: '中', action: '发送产品资料，预约下次沟通', reason: '意向阶段，需加速推进' },
      ],
      summary: '建议优先跟进处于谈判和意向阶段的客户，今日至少完成 3 次有效沟通。',
    });
  }

  return 'AI服务暂未配置，以上为模拟数据。请设置 AI_API_KEY 环境变量。';
}

export async function analyzeTarget(targetAmount) {
  const systemPrompt = '你是一位专业的销售目标分析顾问。请根据目标金额，分析所需的成交单数、线索数、意向客户数等。请只返回JSON格式数据。';
  const userPrompt = `我的月度销售目标是 ${targetAmount} 元，请帮我拆解所需的：成交单数、线索数量、意向客户数、谈判中客户数。假设平均客单价约8万元。`;

  const result = await callLLM(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch {
    return JSON.parse(mockLLM(systemPrompt, userPrompt));
  }
}

export async function getSuggestions(customers) {
  if (!customers || customers.length === 0) {
    return { suggestions: [], summary: '暂无客户数据，请先添加客户。' };
  }

  const customerList = customers.map(c =>
    `- ${c.name}（${c.company}），状态：${c.status}，金额：¥${c.amount}`
  ).join('\n');

  const systemPrompt = '你是一位销售增长顾问。根据客户列表，给出优先跟进建议。返回JSON格式，包含suggestions数组和summary。';
  const userPrompt = `以下是我的客户列表：\n${customerList}\n请分析哪些客户最需要优先跟进，给出行动建议和原因。返回JSON。`;

  const result = await callLLM(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch {
    return JSON.parse(mockLLM(systemPrompt, userPrompt));
  }
}

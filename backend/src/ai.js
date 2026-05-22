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

export async function generateContent(platform, topic, style = 'professional') {
  const systemPrompt = `你是一位专业的新媒体内容创作者，擅长为${platform}平台创作爆款内容。请根据用户提供的主题，生成高质量的内容。返回JSON格式：{ "title": "标题", "content": "正文内容", "hashtags": ["标签1", "标签2"], "tips": "创作建议" }`;
  const userPrompt = `请为${platform}平台创作一篇关于"${topic}"的内容。风格要求：${style}。要求标题有吸引力，内容实用有价值。`;

  const result = await callLLM(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch {
    return mockGenerateContent(platform, topic, style);
  }
}

export async function analyzeCustomer(customerData, timelineHistory) {
  const systemPrompt = `你是一位资深销售顾问，请根据客户信息和跟进记录，分析客户状态并给出销售建议。返回JSON格式：{ "analysis": "客户分析", "needs": ["需求1", "需求2"], "nextAction": "下一步行动建议", "riskLevel": "低/中/高", "recommendedApproach": "建议沟通方式" }`;
  const userPrompt = `客户信息：${JSON.stringify(customerData)}\n跟进历史：${JSON.stringify(timelineHistory)}\n请分析这位客户并给出下一步建议。`;

  const result = await callLLM(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch {
    return mockAnalyzeCustomer(customerData);
  }
}

export async function recommendProducts(leadOrCustomer, allProducts) {
  const systemPrompt = `你是一位产品推荐专家。根据客户/线索的需求和特征，从产品库中推荐最匹配的产品。返回JSON格式：{ "recommendations": [{ "productId": 1, "productName": "产品名", "score": 95, "reason": "推荐理由" }], "summary": "推荐总结" }`;
  const userPrompt = `客户信息：${JSON.stringify(leadOrCustomer)}\n可用产品：${JSON.stringify(allProducts)}\n请推荐最匹配的产品。`;

  const result = await callLLM(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch {
    return mockRecommendProducts(leadOrCustomer, allProducts);
  }
}

export async function generateScript(scenario, context) {
  const systemPrompt = `你是一位金牌销售话术专家。根据场景和客户背景，生成专业的销售话术。返回JSON格式：{ "opening": "开场白话术", "valueProposition": "价值陈述", "objectionHandling": "异议处理话术", "closing": "成交话术", "tips": ["沟通技巧1", "沟通技巧2"] }`;
  const userPrompt = `场景：${scenario}\n客户背景：${JSON.stringify(context)}\n请生成针对性的销售话术。`;

  const result = await callLLM(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch {
    return mockGenerateScript(scenario, context);
  }
}

function mockGenerateContent(platform, topic, style) {
  const platformStyles = {
    xiaohongshu: { title: `🔥 ${topic}超全攻略！建议收藏`, content: `最近很多朋友在问关于${topic}的问题，今天来给大家分享一些实用经验...\n\n📌 核心要点：\n1. 提前做好规划非常重要\n2. 材料准备要齐全\n3. 时间节点要把控好\n\n💡 小贴士：建议提前3个月开始准备，这样时间更充裕。\n\n#实用攻略 #干货分享`, hashtags: ['实用攻略', '干货分享'], tips: '建议配图3-5张，使用短段落提升阅读体验' },
    douyin: { title: `${topic}你必须知道的3件事！`, content: `哈喽大家好！今天聊一聊${topic}这个话题...\n\n🎯 第一点：\n很多人不知道其实可以这样操作\n\n🎯 第二点：\n这个细节90%的人都忽略了\n\n🎯 第三点：\n学会这一招效率翻倍\n\n👍 如果觉得有用记得点赞关注！`, hashtags: ['干货', '涨知识', '职场'], tips: '视频开篇3秒抓住注意力，结尾加互动引导' },
    wechat_article: { title: `${topic}深度解读：2026年最新变化与应对策略`, content: `${topic}是很多企业关注的重点话题。本文将为您详细解读最新政策变化和实操要点。\n\n## 一、政策背景\n\n随着经济形势的变化，${topic}领域的政策也在不断调整...\n\n## 二、核心变化\n\n1. 申请条件有所放宽\n2. 审核流程更加规范\n3. 补贴力度进一步加大\n\n## 三、企业如何应对\n\n建议企业从以下几个方面入手...\n\n## 四、常见问题\n\nQ: 申请周期大概多久？\nA: 一般需要3-6个月，具体视地区而定。`, hashtags: ['政策解读', '企业服务'], tips: '建议在公众号首图用数据图表展示核心观点' },
    bilibili: { title: `【干货】${topic}全流程详解，看完少走弯路`, content: `大家好我是XX，今天给大家带来${topic}的完整攻略...\n\n这个视频会从以下几个方面展开：\n1. 背景知识（2分钟）\n2. 操作流程（5分钟）\n3. 避坑指南（3分钟）\n\n如果对你有帮助，记得一键三连！`, hashtags: ['教程', '经验分享'], tips: '视频建议控制在10分钟以内，加时间戳章节标记' },
  };

  return platformStyles[platform] || platformStyles.xiaohongshu;
}

function mockAnalyzeCustomer(customerData) {
  const statusAnalysis = {
    '谈判': { analysis: '客户处于价格谈判阶段，对产品价值基本认可，当前主要障碍是价格因素。', nextAction: '准备差异化价值对比方案，强调ROI而非单纯价格。', riskLevel: '中' },
    '意向': { analysis: '客户已表达明确兴趣，需要进一步的产品展示和案例验证。', nextAction: '安排产品深度演示，邀请客户参观成功案例。', riskLevel: '低' },
    '线索': { analysis: '客户处于初步了解阶段，尚未确认具体需求。', nextAction: '发送行业白皮书和案例集，建立专业信任度。', riskLevel: '高' },
    '成交': { analysis: '客户已完成成交，应关注后续服务和再次开发。', nextAction: '定期回访了解使用情况，挖掘新的需求机会。', riskLevel: '低' },
  };

  const analysis = statusAnalysis[customerData.status] || statusAnalysis['线索'];

  return {
    analysis: analysis.analysis,
    needs: ['价值验证', '风险控制', '效果承诺'],
    nextAction: analysis.nextAction,
    riskLevel: analysis.riskLevel,
    recommendedApproach: customerData.status === '谈判' ? '面对面沟通' : '微信 + 电话结合',
  };
}

function mockRecommendProducts(leadOrCustomer, allProducts) {
  if (!allProducts || allProducts.length === 0) {
    return { recommendations: [], summary: '暂无可用产品，请先添加产品库' };
  }

  const intent = leadOrCustomer.intent || '';
  const industry = leadOrCustomer.industry || '';

  const scored = allProducts.map(p => {
    let score = 50;
    if (intent === 'qualification' && p.name.includes('认定') || p.name.includes('申报')) score += 30;
    if (intent === 'tax' && p.name.includes('税务')) score += 30;
    if (intent === 'subsidy' && p.name.includes('补贴')) score += 30;
    if (intent === 'ip' && p.name.includes('知识产权')) score += 30;
    if (industry === 'tech' && p.target_customer?.includes('科技')) score += 15;
    if (industry === 'manufacturing' && p.target_customer?.includes('制造业')) score += 15;
    return { ...p, _score: Math.min(score, 100) };
  });

  scored.sort((a, b) => b._score - a._score);
  const top3 = scored.slice(0, 3);

  return {
    recommendations: top3.map(p => ({
      productId: p.id,
      productName: p.name,
      score: p._score,
      reason: p._score >= 80 ? `高度匹配：${p.name}正好满足${industry || '该'}行业需求` : `一般匹配：${p.name}可作为备选方案`,
    })),
    summary: top3.length > 0 ? `基于${intent || '需求'}分析，推荐${top3[0].name}作为首选方案` : '无法匹配适合的产品',
  };
}

function mockGenerateScript(scenario, context) {
  const scripts = {
    'cold_call': {
      opening: '您好，我是XX公司的销售顾问。了解到贵公司在资质申请方面可能有需求，想跟您做个简短交流。',
      valueProposition: '我们已帮助超过200家企业成功拿到高新认定，平均缩短申报周期40%。',
      objectionHandling: '我理解您可能已经有合作的供应商了。不过我们可以针对您公司的具体情况做一个免费的申报评估，您对比一下再决定也不迟。',
      closing: '那我先帮您做一个免费评估报告，预计明天发给您，您方便的话我们后天下午2点做一个15分钟的沟通？',
      tips: ['开场30秒内讲出价值点', '异议处理时先认同再引导', '始终要争取下一步行动承诺'],
    },
    'follow_up': {
      opening: '王总您好，上周发给您的资料看过了吗？有没有什么疑问我可以帮您解答的？',
      valueProposition: '根据您公司的情况，我整理了一个定制化的方案，预计可以帮您节省30%的时间和费用。',
      objectionHandling: '没关系，您慢慢看。我这边还有一些已经拿到认定的客户经验分享，对您做决策应该会有帮助。',
      closing: '这样，我下周一下午再跟您联系。如果中间有任何问题，随时微信我。',
      tips: ['跟进频率控制在3-5天一次', '每次跟进都带来新的价值信息', '注意客户回复的积极度来调整节奏'],
    },
    'negotiation': {
      opening: '关于价格方面，我想跟您分享一个调整后的方案，看看是否能满足您的预算要求。',
      valueProposition: '我们把服务做了模块化拆分，您可以选择最需要的部分，这样总价可以控制在预算范围内，同时核心效果不受影响。',
      objectionHandling: '如果现在签的话，我可以帮您申请一个季度付款的分期方案，这样现金流压力会小很多。',
      closing: '这个优惠方案我帮您保留到本周五，之后价格可能会有调整。我们先把合同条款过一遍，您看今天还是明天方便？',
      tips: ['不要轻易降价，每次让步都要换取对等条件', '强调方案的稀缺性和时效性', '关注客户的非价格需求'],
    },
  };

  return scripts[scenario] || scripts.cold_call;
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

export async function analyzeLead(message, platform) {
  const systemPrompt = `你是一位线索分析专家。请根据用户消息和来源平台，分析线索意图、评分并提供回复建议。返回JSON格式：{ "intent": "意图类型", "intentLabel": "意图中文", "score": 85, "keywords": ["关键词"], "suggestedReply": "建议回复" }`;
  const userPrompt = `用户消息："${message}"\n来源平台：${platform}\n请分析意图、评分(0-100)、并提供回复建议。`;

  const result = await callLLM(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch {
    return {
      intent: 'general',
      intentLabel: '通用咨询',
      score: 60,
      keywords: [],
      suggestedReply: '感谢您的留言！我们提供一站式企业服务解决方案。方便告诉我更多需求细节吗？',
    };
  }
}

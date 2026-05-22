import db from './db.js';
import bcrypt from 'bcryptjs';
import { ensureXpRow } from './gamification.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🌱 开始填充种子数据...\n');

// ─── 1. Create demo user ────────────────────────────────────────────────
const password = bcrypt.hashSync('123456', 10);
const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@growthos.com');

let userId;
if (existingUser) {
  userId = existingUser.id;
  console.log('📌 Demo 用户已存在，使用现有用户');
} else {
  const user = db.prepare(
    `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?) RETURNING id`
  ).get('demo@growthos.com', password, '张三', '管理员');
  userId = user.id;
  ensureXpRow(userId);
  console.log('✅ 创建 Demo 用户: demo@growthos.com / 123456');
}

// ─── 2. Customers ──────────────────────────────────────────────────────
const customerCount = db.prepare('SELECT COUNT(*) as cnt FROM customers WHERE user_id = ?').get(userId).cnt;

if (customerCount === 0) {
  const customers = [
    { name: '字节跳动', company: '字节跳动科技有限公司', status: '谈判', amount: 88000, score: 92, phone: '13800001001', industry: 'tech' },
    { name: '阿里巴巴', company: '阿里巴巴集团', status: '成交', amount: 150000, score: 88, phone: '13800001002', industry: 'tech' },
    { name: '腾讯科技', company: '腾讯控股有限公司', status: '意向', amount: 65000, score: 75, phone: '13800001003', industry: 'tech' },
    { name: '百度', company: '百度在线网络技术公司', status: '线索', amount: 0, score: 45, phone: '13800001004', industry: 'tech' },
    { name: '华为', company: '华为技术有限公司', status: '意向', amount: 200000, score: 82, phone: '13800001005', industry: 'tech' },
    { name: '小米', company: '小米科技有限责任公司', status: '谈判', amount: 120000, score: 78, phone: '13800001006', industry: 'tech' },
    { name: '京东', company: '京东集团', status: '线索', amount: 0, score: 55, phone: '13800001007', industry: 'tech' },
    { name: '网易', company: '网易(杭州)网络有限公司', status: '成交', amount: 95000, score: 85, phone: '13800001008', industry: 'tech' },
    { name: '比亚迪', company: '比亚迪股份有限公司', status: '意向', amount: 280000, score: 70, phone: '13800001009', industry: 'manufacturing' },
    { name: '美的集团', company: '美的集团股份有限公司', status: '线索', amount: 0, score: 40, phone: '13800001010', industry: 'manufacturing' },
  ];

  const insert = db.prepare(
    `INSERT INTO customers (user_id, name, company, status, amount, score, phone, industry, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );

  for (const c of customers) {
    insert.run(userId, c.name, c.company, c.status, c.amount, c.score, c.phone, c.industry);
  }
  console.log(`✅ 创建 ${customers.length} 个客户示例`);
} else {
  console.log(`📌 ${customerCount} 个客户已存在，跳过`);
}

// ─── 3. Timeline ──────────────────────────────────────────────────────
const timelineCount = db.prepare('SELECT COUNT(*) as cnt FROM timeline WHERE user_id = ?').get(userId).cnt;

if (timelineCount === 0) {
  const timelines = [
    { type: '电话', content: '与客户沟通了项目需求和预算范围，对方表示对方案比较满意，约定下周进行第二轮沟通。' },
    { type: '微信', content: '发送了产品资料和案例集，客户表示会认真研究并安排内部讨论。' },
    { type: '面谈', content: '上门拜访客户，进行了详细的产品演示。客户对数据分析模块表现出浓厚兴趣。' },
    { type: '报价', content: '根据需求定制了解决方案并发送报价，客户表示价格在预算范围内。' },
    { type: '其他', content: '收到客户反馈，对项目时间节点有调整需求，已协调团队重新排期。' },
  ];

  const customerIds = db.prepare('SELECT id, name FROM customers WHERE user_id = ?').all(userId);

  const insert = db.prepare(
    `INSERT INTO timeline (user_id, customer_id, type, content, created_at)
     VALUES (?, ?, ?, ?, datetime('now', ?))`
  );

  customerIds.forEach((c, i) => {
    const t = timelines[i % timelines.length];
    const hoursAgo = `-${(i + 1) * 3} hours`;
    insert.run(userId, c.id, t.type, t.content, hoursAgo);
  });
  console.log(`✅ 创建 ${customerIds.length} 条跟进记录`);
} else {
  console.log(`📌 ${timelineCount} 条跟进记录已存在，跳过`);
}

// ─── 4. Products ──────────────────────────────────────────────────────
const productCount = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE user_id = ?').get(userId).cnt;

if (productCount === 0) {
  const products = [
    { name: '高新认定服务', price: 15000, category: '咨询服务', description: '帮助企业申请高新技术企业认定', service_content: '材料准备,申报跟进,答辩辅导', target_customer: '科技企业', duration: '3个月', profit_margin: 60 },
    { name: '专精特新申报', price: 25000, category: '咨询服务', description: '专精特新企业认定申报全流程服务', service_content: '企业评估,材料编制,申报提交', target_customer: '中小企业', duration: '4个月', profit_margin: 55 },
    { name: '税务筹划方案', price: 8000, category: '咨询服务', description: '企业税务优化方案设计与实施', service_content: '税务调研,方案设计,落地辅导', target_customer: '全行业', duration: '1个月', profit_margin: 70 },
    { name: '知识产权代理', price: 5000, category: '咨询服务', description: '专利商标申请代理服务', service_content: '检索分析,申请提交,进度跟进', target_customer: '全行业', duration: '6个月', profit_margin: 50 },
    { name: '政府补贴申请', price: 20000, category: '咨询服务', description: '政府各类补贴项目申请服务', service_content: '资质评估,材料准备,申报提交,验收辅导', target_customer: '制造业', duration: '6个月', profit_margin: 65 },
  ];

  const insert = db.prepare(
    `INSERT INTO products (user_id, name, price, category, description, service_content, target_customer, duration, profit_margin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const p of products) {
    insert.run(userId, p.name, p.price, p.category, p.description, p.service_content, p.target_customer, p.duration, p.profit_margin);
  }
  console.log(`✅ 创建 ${products.length} 个产品`);
} else {
  console.log(`📌 ${productCount} 个产品已存在，跳过`);
}

// ─── 5. Pipeline ──────────────────────────────────────────────────────
const pipelineCount = db.prepare('SELECT COUNT(*) as cnt FROM pipeline WHERE user_id = ?').get(userId).cnt;

if (pipelineCount === 0) {
  const deals = [
    { customer_name: '字节跳动', stage: 'negotiating', amount: 88000, probability: 0.7, expected_close: '2026-06', notes: '价格谈判中' },
    { customer_name: '华为', stage: 'negotiating', amount: 200000, probability: 0.65, expected_close: '2026-06', notes: '商务条款洽谈' },
    { customer_name: '腾讯科技', stage: 'interested', amount: 65000, probability: 0.5, expected_close: '2026-05', notes: '已报价待确认' },
    { customer_name: '小米', stage: 'interested', amount: 120000, probability: 0.55, expected_close: '2026-07', notes: '产品演示已完成' },
    { customer_name: '比亚迪', stage: 'interested', amount: 280000, probability: 0.4, expected_close: '2026-07', notes: '初步沟通，需求匹配度高' },
    { customer_name: '百度', stage: 'lead', amount: 0, probability: 0.15, expected_close: '2026-08', notes: '刚建立联系' },
  ];

  const insert = db.prepare(
    `INSERT INTO pipeline (user_id, customer_name, stage, amount, probability, expected_close, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const d of deals) {
    insert.run(userId, d.customer_name, d.stage, d.amount, d.probability, d.expected_close, d.notes);
  }
  console.log(`✅ 创建 ${deals.length} 个管道交易`);
} else {
  console.log(`📌 ${pipelineCount} 个管道交易已存在，跳过`);
}

// ─── 6. Leads ─────────────────────────────────────────────────────────
const leadCount = db.prepare('SELECT COUNT(*) as cnt FROM leads WHERE user_id = ?').get(userId).cnt;

if (leadCount === 0) {
  const leads = [
    { name: '王经理', platform: '企业微信', message: '您好，想咨询一下高新企业认定的具体条件和流程', intent: 'qualification', score: 92, status: 'pending', industry: '科技' },
    { name: '李总', platform: '微信', message: '最近税务政策有什么变化？我们公司能享受哪些优惠？', intent: 'tax', score: 78, status: 'qualified', industry: '中小企业' },
    { name: '赵先生', platform: '官网', message: '请问政府对于科技创新企业有什么补贴政策？', intent: 'subsidy', score: 85, status: 'contacted', industry: '科技' },
    { name: '陈女士', platform: '抖音', message: '我们公司的商标被抢注了，该怎么办？', intent: 'ip', score: 80, status: 'pending', industry: '电商' },
    { name: '刘总', platform: '小程序', message: '想了解高新企业复审的流程和注意事项', intent: 'qualification', score: 65, status: 'converted', industry: '科技' },
  ];

  const insert = db.prepare(
    `INSERT INTO leads (user_id, name, platform, message, intent, score, status, industry)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const l of leads) {
    insert.run(userId, l.name, l.platform, l.message, l.intent, l.score, l.status, l.industry);
  }
  console.log(`✅ 创建 ${leads.length} 条线索`);
} else {
  console.log(`📌 ${leadCount} 条线索已存在，跳过`);
}

// ─── 7. Content ───────────────────────────────────────────────────────
const contentCount = db.prepare('SELECT COUNT(*) as cnt FROM content WHERE user_id = ?').get(userId).cnt;

if (contentCount === 0) {
  const contents = [
    { title: '2026年高新认定最新政策解读', platform: 'xiaohongshu', type: 'article', tags: ['高新认定', '政策解读'], status: 'published', views: 1200, likes: 85, shares: 23 },
    { title: '企业税务筹划3个要点', platform: 'douyin', type: 'video_script', tags: ['税务', '筹划'], status: 'published', views: 3400, likes: 156, shares: 45 },
    { title: '专精特新vs高新认定区别', platform: 'wechat_article', type: 'article', tags: ['专精特新', '高新认定'], status: 'draft', views: 0, likes: 0, shares: 0 },
    { title: '中小企业如何申请政府补贴', platform: 'xiaohongshu', type: 'article', tags: ['政府补贴', '中小企业'], status: 'published', views: 2300, likes: 120, shares: 34 },
    { title: '2026年AI销售趋势分析', platform: 'bilibili', type: 'video_script', tags: ['AI', '销售', '趋势'], status: 'draft', views: 0, likes: 0, shares: 0 },
  ];

  const insert = db.prepare(
    `INSERT INTO content (user_id, title, platform, type, tags, status, stats_views, stats_likes, stats_shares)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const c of contents) {
    insert.run(userId, c.title, c.platform, c.type, JSON.stringify(c.tags), c.status, c.views, c.likes, c.shares);
  }
  console.log(`✅ 创建 ${contents.length} 条内容`);
} else {
  console.log(`📌 ${contentCount} 条内容已存在，跳过`);
}

console.log('\n🎉 种子数据填充完成！');
console.log('──────────────────────────────────────');
console.log('Demo 账号: demo@growthos.com');
console.log('Demo 密码: 123456');
console.log('──────────────────────────────────────');

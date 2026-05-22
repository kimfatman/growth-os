const http = require('http');
const crypto = require('crypto');

const PORT = 3001;
const BASE = '/api';

// ─── In-memory data store ───────────────────────────────────
const DB = {
  users: [],
  customers: [],
  timelines: [],
  targets: [],
  xp: {},
  xpLogs: [],
  dailyTasks: {},
  achievements: {},
  streaks: {},
};

const JWT_SECRET = 'mock-secret';

// ─── Helpers ────────────────────────────────────────────────
function uid() { return Date.now() + Math.floor(Math.random() * 1000); }
function now() { return new Date().toISOString(); }
function today() { return now().split('T')[0]; }
function yesterday() { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const body = Buffer.from(JSON.stringify({...payload,iat:Date.now(),exp:Date.now()+86400000*7})).toString('base64url');
  const sig = crypto.createHmac('sha256',JWT_SECRET).update(header+'.'+body).digest('base64url');
  return header+'.'+body+'.'+sig;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    const body = JSON.parse(Buffer.from(parts[1],'base64url').toString());
    return body;
  } catch { return null; }
}

function getUserId(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7))?.id || null;
}

function send(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  });
  res.end(JSON.stringify(data));
}

function body(req) {
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
  });
}

// ─── XP / Level System ─────────────────────────────────────
const XP_RULES = { new_customer: 5, record_timeline: 10, advance_stage: 20, close_deal: 100 };
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];

function calcLevel(totalXp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function addXp(userId, action) {
  const xpAmount = XP_RULES[action] || 10;
  if (!DB.xp[userId]) DB.xp[userId] = { total_xp: 0, level: 1 };
  DB.xp[userId].total_xp += xpAmount;
  const newLevel = calcLevel(DB.xp[userId].total_xp);
  const leveledUp = newLevel > DB.xp[userId].level;
  DB.xp[userId].level = newLevel;
  DB.xpLogs.push({ id: uid(), user_id: userId, amount: xpAmount, reason: action, created_at: now() });
  return { xpGained: xpAmount, reason: action, totalXp: DB.xp[userId].total_xp, level: newLevel, leveledUp };
}

function ensureTasks(userId) {
  if (!DB.dailyTasks[userId]) {
    DB.dailyTasks[userId] = [
      { task_type: 'follow_up', label: '跟进客户', target: 3, progress: 0, xp_reward: 15, completed: false },
      { task_type: 'new_customer', label: '新增客户', target: 2, progress: 0, xp_reward: 10, completed: false },
      { task_type: 'advance_stage', label: '推进阶段', target: 1, progress: 0, xp_reward: 20, completed: false },
    ];
  }
  return DB.dailyTasks[userId];
}

function updateTask(userId, taskType) {
  const tasks = ensureTasks(userId);
  const task = tasks.find(t => t.task_type === taskType);
  if (task) {
    task.progress = Math.min(task.progress + 1, task.target);
    task.completed = task.progress >= task.target;
  }
  return task;
}

// ─── Seed data ──────────────────────────────────────────────
function seedData(userId) {
  const customers = [
    { name: '张伟', company: '字节跳动', phone: '13800001001', status: '谈判', amount: 88000 },
    { name: '李娜', company: '阿里巴巴', phone: '13800001002', status: '意向', amount: 150000 },
    { name: '王强', company: '腾讯科技', phone: '13800001003', status: '成交', amount: 65000 },
    { name: '赵敏', company: '百度', phone: '13800001004', status: '线索', amount: 0 },
    { name: '孙鹏', company: '华为', phone: '13800001005', status: '意向', amount: 200000 },
    { name: '周杰', company: '小米', phone: '13800001006', status: '谈判', amount: 120000 },
    { name: '吴芳', company: '京东', phone: '13800001007', status: '线索', amount: 0 },
    { name: '陈龙', company: '网易', phone: '13800001008', status: '成交', amount: 95000 },
  ];
  for (const c of customers) {
    const cid = uid();
    DB.customers.push({ id: cid, user_id: userId, ...c, notes: '', created_at: now(), updated_at: now() });
    addXp(userId, 'new_customer');
  }
  addXp(userId, 'advance_stage');
  addXp(userId, 'close_deal');
  addXp(userId, 'close_deal');

  DB.streaks[userId] = { current_streak: 5, longest_streak: 12, last_activity_date: today() };
  DB.achievements[userId] = [
    { code: 'first_deal', title: '首单成交 🎉', unlocked_at: now() },
    { code: 'seven_day_streak', title: '连续跟进7天 🔥', unlocked_at: now() },
  ];
}

// ─── Router ─────────────────────────────────────────────────
async function handler(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
    });
    return res.end();
  }

  // Health
  if (path === BASE + '/health') return send(res, 200, { status: 'ok', version: '1.0.0' });

  // ── Auth ──────────────────────────────────────────────
  if (method === 'POST' && path === BASE + '/auth/register') {
    const b = await body(req);
    if (DB.users.find(u => u.email === b.email)) return send(res, 409, { error: '该邮箱已注册' });
    const user = { id: uid(), email: b.email, name: b.name || '新用户', role: 'sales', created_at: now() };
    DB.users.push(user);
    DB.xp[user.id] = { total_xp: 0, level: 1 };
    seedData(user.id);
    const token = signToken({ id: user.id, email: user.email });
    return send(res, 201, { token, user: { id: user.id, email: user.email, name: user.name } });
  }

  if (method === 'POST' && path === BASE + '/auth/login') {
    const b = await body(req);
    const user = DB.users.find(u => u.email === b.email);
    if (!user) return send(res, 401, { error: '邮箱或密码错误' });
    const token = signToken({ id: user.id, email: user.email });
    return send(res, 200, { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  if (method === 'GET' && path === BASE + '/auth/me') {
    const uid = getUserId(req);
    const user = DB.users.find(u => u.id === uid);
    if (!user) return send(res, 401, { error: '未授权' });
    return send(res, 200, { user });
  }

  // ── Customers ─────────────────────────────────────────
  if (method === 'GET' && path === BASE + '/customers/stats') {
    const uid = getUserId(req);
    const custs = DB.customers.filter(c => c.user_id === uid);
    const total = custs.length;
    const pipeline_value = custs.filter(c => c.status !== '成交').reduce((s,c) => s + Number(c.amount), 0);
    const closed_deals = custs.filter(c => c.status === '成交').length;
    const intent = custs.filter(c => c.status === '意向').length;
    const negotiation = custs.filter(c => c.status === '谈判').length;
    const todayRevenue = custs.filter(c => c.status === '成交').reduce((s,c) => s + Number(c.amount), 0);
    return send(res, 200, { stats: { total, pipeline_value, closed_deals, intent, negotiation, today_revenue: todayRevenue } });
  }

  if (method === 'GET' && path === BASE + '/customers') {
    const uid = getUserId(req);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.toLowerCase();
    let custs = DB.customers.filter(c => c.user_id === uid);
    if (status) custs = custs.filter(c => c.status === status);
    if (search) custs = custs.filter(c => c.name.toLowerCase().includes(search) || c.company.toLowerCase().includes(search));
    custs.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
    return send(res, 200, { customers: custs });
  }

  if (method === 'POST' && path === BASE + '/customers') {
    const uid = getUserId(req);
    const b = await body(req);
    const c = { id: uid(), user_id: uid, name: b.name, company: b.company||'', phone: b.phone||'', status: b.status||'线索', amount: b.amount||0, notes: b.notes||'', created_at: now(), updated_at: now() };
    DB.customers.push(c);
    const xp = addXp(uid, 'new_customer');
    updateTask(uid, 'new_customer');
    return send(res, 201, { customer: c, xp });
  }

  const custMatch = path.match(/^\/api\/customers\/(\d+)$/);
  if (custMatch) {
    const cid = Number(custMatch[1]);

    if (method === 'GET') {
      const uid = getUserId(req);
      const c = DB.customers.find(c => c.id === cid && c.user_id === uid);
      if (!c) return send(res, 404, { error: '客户不存在' });
      return send(res, 200, { customer: c });
    }

    if (method === 'PUT') {
      const uid = getUserId(req);
      const existing = DB.customers.find(c => c.id === cid && c.user_id === uid);
      if (!existing) return send(res, 404, { error: '客户不存在' });
      const b = await body(req);
      const oldStatus = existing.status;
      Object.assign(existing, b, { updated_at: now() });
      let xp = null;
      if (b.status && b.status !== oldStatus) {
        if (b.status === '成交') xp = addXp(uid, 'close_deal');
        else xp = addXp(uid, 'advance_stage');
        updateTask(uid, 'advance_stage');
      }
      return send(res, 200, { customer: existing, xp });
    }
  }

  // ── Timeline ──────────────────────────────────────────
  if (method === 'GET' && path === BASE + '/timeline/grouped') {
    const uid = getUserId(req);
    const records = DB.timelines.filter(t => t.user_id === uid).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    const groups = { today: [], yesterday: [], earlier: [] };
    const td = today(), yd = yesterday();
    for (const r of records) {
      const d = r.created_at.split('T')[0];
      if (d === td) groups.today.push(r);
      else if (d === yd) groups.yesterday.push(r);
      else groups.earlier.push(r);
    }
    return send(res, 200, { groups });
  }

  if (method === 'GET' && path === BASE + '/timeline/recent') {
    const uid = getUserId(req);
    const records = DB.timelines.filter(t => t.user_id === uid).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,50);
    return send(res, 200, { records });
  }

  if (method === 'POST' && path === BASE + '/timeline') {
    const uid = getUserId(req);
    const b = await body(req);
    const cust = DB.customers.find(c => c.id === b.customer_id && c.user_id === uid);
    if (!cust) return send(res, 404, { error: '客户不存在' });
    const record = { id: uid(), customer_id: b.customer_id, user_id: uid, type: b.type, content: b.content, customer_name: cust.name, created_at: now() };
    DB.timelines.push(record);
    const xp = addXp(uid, 'record_timeline');
    updateTask(uid, 'follow_up');
    return send(res, 201, { record, xp });
  }

  // ── Targets ───────────────────────────────────────────
  if (method === 'GET' && path === BASE + '/targets') {
    const uid = getUserId(req);
    const month = url.searchParams.get('month') || now().slice(0,7);
    const target = DB.targets.find(t => t.user_id === uid && t.month === month);
    const currentRevenue = DB.customers.filter(c => c.user_id === uid && c.status === '成交').reduce((s,c) => s + Number(c.amount), 0);
    return send(res, 200, { target: target || null, current_revenue: currentRevenue });
  }

  if (method === 'POST' && path === BASE + '/targets/analyze') {
    const uid = getUserId(req);
    const b = await body(req);
    const amount = b.target_amount;
    const month = now().slice(0,7);
    const avgDeal = 80000;
    const dealsNeeded = Math.ceil(amount / avgDeal);
    const breakdown = {
      targetAmount: amount, dealsNeeded, leadsNeeded: Math.ceil(dealsNeeded / 0.2),
      intentNeeded: Math.ceil(dealsNeeded / 0.4), negotiationNeeded: Math.ceil(dealsNeeded / 0.6),
      avgDealSize: avgDeal,
      suggestion: `根据AI分析，平均客单价约 ¥${(avgDeal/10000).toFixed(1)}万。建议本月聚焦 ${Math.ceil(dealsNeeded / 0.2)} 条线索，其中 ${Math.ceil(dealsNeeded / 0.4)} 个进入意向，最终完成 ${dealsNeeded} 单成交。`,
    };
    DB.targets = DB.targets.filter(t => !(t.user_id === uid && t.month === month));
    DB.targets.push({ user_id: uid, target_amount: amount, month, ai_breakdown: breakdown });
    const currentRevenue = DB.customers.filter(c => c.user_id === uid && c.status === '成交').reduce((s,c) => s + Number(c.amount), 0);
    return send(res, 200, { breakdown, target_amount: amount, current_revenue: currentRevenue });
  }

  // ── AI ────────────────────────────────────────────────
  if (method === 'GET' && path === BASE + '/ai/suggestions') {
    const uid = getUserId(req);
    const custs = DB.customers.filter(c => c.user_id === uid && c.status !== '成交')
      .sort((a,b) => {
        const order = { '谈判':1, '意向':2, '线索':3 };
        return (order[a.status]||4) - (order[b.status]||4);
      }).slice(0,20);
    return send(res, 200, {
      suggestions: [
        { customerName: '张伟', priority: '高', action: '今日跟进，重点沟通方案报价', reason: '处于谈判阶段，转化概率高' },
        { customerName: '李娜', priority: '中', action: '发送产品资料，预约下次沟通', reason: '意向阶段，需加速推进' },
      ],
      summary: '建议优先跟进处于谈判和意向阶段的客户，今日至少完成 3 次有效沟通。',
      customers: custs,
    });
  }

  // ── Gamification ──────────────────────────────────────
  if (method === 'GET' && path === BASE + '/gamification/xp') {
    const uid = getUserId(req);
    if (!DB.xp[uid]) DB.xp[uid] = { total_xp: 0, level: 1 };
    const lvl = DB.xp[uid].level;
    const base = lvl > 1 ? LEVEL_THRESHOLDS[lvl-2] : 0;
    const next = lvl >= LEVEL_THRESHOLDS.length ? 999999 : LEVEL_THRESHOLDS[lvl] - LEVEL_THRESHOLDS[lvl-1];
    const cur = DB.xp[uid].total_xp - base;
    return send(res, 200, { total_xp: DB.xp[uid].total_xp, level: lvl, nextLevelXp: next, currentXp: cur });
  }

  if (method === 'GET' && path === BASE + '/gamification/tasks') {
    const uid = getUserId(req);
    const tasks = ensureTasks(uid);
    return send(res, 200, { tasks: tasks.map(t => ({ ...t, date: today() })) });
  }

  if (method === 'GET' && path === BASE + '/gamification/achievements') {
    const uid = getUserId(req);
    return send(res, 200, { achievements: DB.achievements[uid] || [] });
  }

  if (method === 'GET' && path === BASE + '/gamification/xp-log') {
    const uid = getUserId(req);
    const logs = DB.xpLogs.filter(l => l.user_id === uid).reverse().slice(0,20);
    return send(res, 200, { logs });
  }

  // ── 404 ──────────────────────────────────────────────
  send(res, 404, { error: 'Not found: ' + method + ' ' + path });
}

const server = http.createServer(handler);
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Growth OS Mock API Server              ║');
  console.log('║   http://localhost:' + String(PORT).padEnd(5) + '                     ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  Test accounts available:                ║');
  console.log('║  1. 注册新账号即可自动填充示例数据        ║');
  console.log('║  2. 任意 email + 任意密码 6位以上        ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});

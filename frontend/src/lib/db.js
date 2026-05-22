// v1 - JSON本地存储，后期可无缝切换到 PostgreSQL
const STORAGE_KEYS = {
  customers: 'growth_os_customers',
  products: 'growth_os_products',
  leads: 'growth_os_leads',
  pipeline: 'growth_os_pipeline',
  content: 'growth_os_content',
  dashboard: 'growth_os_dashboard',
};

const defaultData = {
  customers: [
    { id: 1, name: '阿里巴巴', score: 92, stage: 'negotiating', amount: 120000, last_follow: '2026-04-24', industry: 'tech', tags: ['大客户', '科技'], notes: '' },
    { id: 2, name: '腾讯科技', score: 88, stage: 'quoted', amount: 80000, last_follow: '2026-04-23', industry: 'tech', tags: ['大客户', '科技'], notes: '' },
    { id: 3, name: '字节跳动', score: 75, stage: 'interested', amount: 50000, last_follow: '2026-04-22', industry: 'tech', tags: ['科技'], notes: '' },
    { id: 4, name: '比亚迪', score: 70, stage: 'lead', amount: 30000, last_follow: '2026-04-20', industry: 'manufacturing', tags: ['制造业'], notes: '' },
    { id: 5, name: '美团', score: 65, stage: 'lead', amount: 20000, last_follow: '2026-04-19', industry: 'tech', tags: ['科技'], notes: '' },
  ],
  products: [
    { id: 1, name: '高新认定服务', price: 15000, category: '资质服务', description: '帮助企业申请高新认定', service_content: ['材料准备', '申报'], target_customer: '科技企业', duration: '3个月', profit_margin: 0.6 },
    { id: 2, name: '专精特新申报', price: 25000, category: '资质服务', description: '专精特新企业认定申报', service_content: ['评估', '材料', '申报'], target_customer: '中小企业', duration: '4个月', profit_margin: 0.55 },
    { id: 3, name: '税务筹划方案', price: 8000, category: '财税服务', description: '企业税务优化方案设计', service_content: ['调研', '方案', '落地'], target_customer: '全行业', duration: '1个月', profit_margin: 0.7 },
    { id: 4, name: '知识产权代理', price: 5000, category: '知识产权', description: '专利商标申请代理', service_content: ['申请', '跟进'], target_customer: '全行业', duration: '6个月', profit_margin: 0.5 },
    { id: 5, name: '政府补贴申请', price: 20000, category: '资质服务', description: '政府各类补贴申请', service_content: ['评估', '材料', '申报', '验收'], target_customer: '制造业', duration: '6个月', profit_margin: 0.65 },
  ],
  leads: [
    { id: 1, user: '用户A', platform: 'douyin', message: '咨询高新认定价格', intent: 'qualification', score: 85, status: 'pending', created_at: '2026-04-24', industry: 'tech' },
    { id: 2, user: '用户B', platform: 'xiaohongshu', message: '公司想做税务优化', intent: 'tax', score: 78, status: 'contacted', created_at: '2026-04-23', industry: 'tech' },
    { id: 3, user: '用户C', platform: 'wechat_video', message: '专精特新怎么申报', intent: 'qualification', score: 72, status: 'pending', created_at: '2026-04-22', industry: 'manufacturing' },
    { id: 4, user: '用户D', platform: 'bilibili', message: '有没有政府补贴项目', intent: 'subsidy', score: 65, status: 'qualified', created_at: '2026-04-21', industry: 'manufacturing' },
    { id: 5, user: '用户E', platform: 'douyin', message: '咨询商标注册流程', intent: 'ip', score: 55, status: 'pending', created_at: '2026-04-20', industry: 'tech' },
  ],
  pipeline: [
    { id: 1, customer_id: 1, customer_name: '阿里巴巴', stage: 'negotiating', amount: 120000, probability: 0.7, expected_close: '2026-06', notes: '价格谈判中' },
    { id: 2, customer_id: 2, customer_name: '腾讯科技', stage: 'quoted', amount: 80000, probability: 0.5, expected_close: '2026-05', notes: '已报价待确认' },
    { id: 3, customer_id: 3, customer_name: '字节跳动', stage: 'interested', amount: 50000, probability: 0.3, expected_close: '2026-06', notes: '初步沟通' },
    { id: 4, customer_id: 4, customer_name: '比亚迪', stage: 'lead', amount: 30000, probability: 0.1, expected_close: '2026-07', notes: '刚建立联系' },
  ],
  content: [
    { id: 1, title: '2026年高新认定最新政策解读', platform: 'xiaohongshu', type: 'article', tags: ['高新认定', '政策'], created_at: '2026-04-24', status: 'published', stats: { views: 1200, likes: 85, shares: 23 } },
    { id: 2, title: '企业税务筹划3个要点', platform: 'douyin', type: 'video_script', tags: ['税务', '筹划'], created_at: '2026-04-23', status: 'published', stats: { views: 3400, likes: 156, shares: 45 } },
    { id: 3, title: '专精特新vs高新认定区别', platform: 'wechat_article', type: 'article', tags: ['专精特新', '高新认定'], created_at: '2026-04-22', status: 'draft', stats: { views: 0, likes: 0, shares: 0 } },
  ],
  dashboard: {
    revenue_today: 80000,
    conversion_rate: 0.68,
    high_value_customers: 3,
    risk_customers: 2,
    forecast_amount: 280000,
    active_deals: 4,
    new_leads_today: 7,
  },
};

function load(key) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    return raw ? JSON.parse(raw) : defaultData[key];
  } catch {
    return defaultData[key];
  }
}

function save(key, data) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
}

export const db = {
  // Customers
  getCustomers: () => load('customers'),
  saveCustomers: (data) => save('customers', data),
  addCustomer: (customer) => {
    const list = load('customers');
    customer.id = Date.now();
    list.push(customer);
    save('customers', list);
    return customer;
  },
  updateCustomer: (id, updates) => {
    const list = load('customers');
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; save('customers', list); }
    return list[idx];
  },
  deleteCustomer: (id) => {
    const list = load('customers').filter(c => c.id !== id);
    save('customers', list);
  },

  // Products
  getProducts: () => load('products'),
  saveProducts: (data) => save('products', data),
  addProduct: (product) => {
    const list = load('products');
    product.id = Date.now();
    list.push(product);
    save('products', list);
    return product;
  },

  // Leads
  getLeads: () => load('leads'),
  saveLeads: (data) => save('leads', data),
  updateLead: (id, updates) => {
    const list = load('leads');
    const idx = list.findIndex(l => l.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; save('leads', list); }
    return list[idx];
  },

  // Pipeline
  getPipeline: () => load('pipeline'),
  savePipeline: (data) => save('pipeline', data),
  updatePipelineStage: (id, stage, probability) => {
    const list = load('pipeline');
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], stage, probability }; save('pipeline', list); }
    return list[idx];
  },

  // Content
  getContent: () => load('content'),
  saveContent: (data) => save('content', data),

  // Dashboard
  getDashboard: () => load('dashboard'),
  saveDashboard: (data) => save('dashboard', data),

  // Utility
  resetAll: () => {
    Object.keys(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(STORAGE_KEYS[key]);
    });
  },
};

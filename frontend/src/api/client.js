const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('未授权');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const api = {
  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },
  getCustomerStats: () => request('/customers/stats'),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: data }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: data }),

  // Timeline
  getTimelineGrouped: () => request('/timeline/grouped'),
  getTimelineRecent: () => request('/timeline/recent'),
  getCustomerTimeline: (customerId) => request(`/timeline/customer/${customerId}`),
  createTimeline: (data) => request('/timeline', { method: 'POST', body: data }),

  // Targets
  getTarget: (month) => request(`/targets?month=${month || ''}`),
  analyzeTarget: (data) => request('/targets/analyze', { method: 'POST', body: data }),

  // AI
  getAISuggestions: () => request('/ai/suggestions'),
  generateAIContent: (data) => request('/ai/generate-content', { method: 'POST', body: data }),
  analyzeCustomer: (data) => request('/ai/analyze-customer', { method: 'POST', body: data }),
  recommendProducts: (data) => request('/ai/recommend-products', { method: 'POST', body: data }),
  generateScript: (data) => request('/ai/generate-script', { method: 'POST', body: data }),

  // Leads
  getLeads: () => request('/leads'),
  createLead: (data) => request('/leads', { method: 'POST', body: data }),
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: data }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
  analyzeLead: (data) => request('/leads/analyze', { method: 'POST', body: data }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  createProduct: (data) => request('/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  importProducts: (data) => request('/products/import', { method: 'POST', body: data }),

  // Pipeline
  getPipeline: () => request('/pipeline'),
  createPipelineDeal: (data) => request('/pipeline', { method: 'POST', body: data }),
  updatePipelineDeal: (id, data) => request(`/pipeline/${id}`, { method: 'PUT', body: data }),
  deletePipelineDeal: (id) => request(`/pipeline/${id}`, { method: 'DELETE' }),
  getPipelineForecast: () => request('/pipeline/forecast'),

  // Content
  getContent: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/content${query ? `?${query}` : ''}`);
  },
  createContent: (data) => request('/content', { method: 'POST', body: data }),
  updateContent: (id, data) => request(`/content/${id}`, { method: 'PUT', body: data }),
  deleteContent: (id) => request(`/content/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Gamification
  getXp: () => request('/gamification/xp'),
  getTasks: () => request('/gamification/tasks'),
  getAchievements: () => request('/gamification/achievements'),
  getXpLog: () => request('/gamification/xp-log'),
};

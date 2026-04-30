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

  // Gamification
  getXp: () => request('/gamification/xp'),
  getTasks: () => request('/gamification/tasks'),
  getAchievements: () => request('/gamification/achievements'),
  getXpLog: () => request('/gamification/xp-log'),
};

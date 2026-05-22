import { create } from '../lib/zustand';
import { db } from '../lib/db';
import { api } from '../api/client';

export const useStore = create((set, get) => ({
  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Global state
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  // Customers
  customers: db.getCustomers(),
  loadCustomers: () => {
    set({ loading: true, error: null });
    return api.getCustomers()
      .then(data => {
        const list = data.customers || data || [];
        db.saveCustomers(list);
        set({ customers: list, loading: false });
      })
      .catch(() => {
        set({ customers: db.getCustomers(), loading: false, error: '加载客户失败，使用本地数据' });
      });
  },
  addCustomer: (customer) => {
    set({ loading: true, error: null });
    return api.createCustomer(customer)
      .then(data => {
        const saved = data.customer || data;
        db.addCustomer(saved);
        set({ customers: db.getCustomers(), loading: false });
        return saved;
      })
      .catch(() => {
        const saved = db.addCustomer(customer);
        set({ customers: db.getCustomers(), loading: false, error: '保存失败，已存入本地' });
        return saved;
      });
  },
  updateCustomer: (id, updates) => {
    set({ loading: true, error: null });
    return api.updateCustomer(id, updates)
      .then(data => {
        const saved = data.customer || data;
        db.updateCustomer(id, saved);
        set({ customers: db.getCustomers(), loading: false });
        return saved;
      })
      .catch(() => {
        const saved = db.updateCustomer(id, updates);
        set({ customers: db.getCustomers(), loading: false, error: '更新失败，已存入本地' });
        return saved;
      });
  },
  deleteCustomer: (id) => {
    return api.deleteCustomer(id)
      .then(() => {
        db.deleteCustomer(id);
        set({ customers: db.getCustomers() });
      })
      .catch(() => {
        db.deleteCustomer(id);
        set({ customers: db.getCustomers(), error: '删除失败，已在本地移除' });
      });
  },

  // Products
  products: db.getProducts(),
  loadProducts: () => {
    set({ loading: true, error: null });
    return api.getProducts()
      .then(data => {
        const list = data.products || data || [];
        db.saveProducts(list);
        set({ products: list, loading: false });
      })
      .catch(() => {
        set({ products: db.getProducts(), loading: false, error: '加载产品失败，使用本地数据' });
      });
  },
  addProduct: (product) => {
    set({ loading: true, error: null });
    return api.createProduct(product)
      .then(data => {
        const saved = data.product || data;
        db.addProduct(saved);
        set({ products: db.getProducts(), loading: false });
        return saved;
      })
      .catch(() => {
        const saved = db.addProduct(product);
        set({ products: db.getProducts(), loading: false, error: '保存失败，已存入本地' });
        return saved;
      });
  },
  updateProduct: (id, updates) => {
    set({ loading: true, error: null });
    return api.updateProduct(id, updates)
      .then(data => {
        const saved = data.product || data;
        const list = db.getProducts();
        const idx = list.findIndex(p => p.id === id);
        if (idx >= 0) { list[idx] = { ...list[idx], ...saved }; db.saveProducts(list); }
        set({ products: db.getProducts(), loading: false });
        return saved;
      })
      .catch(() => {
        const list = db.getProducts();
        const idx = list.findIndex(p => p.id === id);
        if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; db.saveProducts(list); }
        set({ products: db.getProducts(), loading: false, error: '更新失败，已存入本地' });
      });
  },
  deleteProduct: (id) => {
    return api.deleteProduct(id)
      .then(() => {
        const list = db.getProducts().filter(p => p.id !== id);
        db.saveProducts(list);
        set({ products: list });
      })
      .catch(() => {
        const list = db.getProducts().filter(p => p.id !== id);
        db.saveProducts(list);
        set({ products: list, error: '删除失败，已在本地移除' });
      });
  },
  importProducts: (products) => {
    set({ loading: true, error: null });
    return api.importProducts({ products })
      .then(data => {
        const imported = data.products || data || [];
        const list = db.getProducts();
        imported.forEach(p => { list.push(p); });
        db.saveProducts(list);
        set({ products: list, loading: false });
      })
      .catch(() => {
        const list = db.getProducts();
        products.forEach(p => { p.id = Date.now() + Math.random(); list.push(p); });
        db.saveProducts(list);
        set({ products: list, loading: false, error: '导入失败，已存入本地' });
      });
  },

  // Leads
  leads: db.getLeads(),
  loadLeads: () => {
    set({ loading: true, error: null });
    return api.getLeads()
      .then(data => {
        const list = data.leads || data || [];
        db.saveLeads(list);
        set({ leads: list, loading: false });
      })
      .catch(() => {
        set({ leads: db.getLeads(), loading: false, error: '加载线索失败，使用本地数据' });
      });
  },
  addLead: (lead) => {
    set({ loading: true, error: null });
    return api.createLead(lead)
      .then(data => {
        const saved = data.lead || data;
        const list = db.getLeads();
        list.push(saved);
        db.saveLeads(list);
        set({ leads: list, loading: false });
        return saved;
      })
      .catch(() => {
        const list = db.getLeads();
        lead.id = Date.now();
        list.push(lead);
        db.saveLeads(list);
        set({ leads: list, loading: false, error: '保存失败，已存入本地' });
      });
  },
  updateLead: (id, updates) => {
    set({ loading: true, error: null });
    return api.updateLead(id, updates)
      .then(data => {
        const saved = data.lead || data;
        db.updateLead(id, saved);
        set({ leads: db.getLeads(), loading: false });
        return saved;
      })
      .catch(() => {
        const saved = db.updateLead(id, updates);
        set({ leads: db.getLeads(), loading: false, error: '更新失败，已存入本地' });
        return saved;
      });
  },
  deleteLead: (id) => {
    return api.deleteLead(id)
      .then(() => {
        const list = db.getLeads().filter(l => l.id !== id);
        db.saveLeads(list);
        set({ leads: list });
      })
      .catch(() => {
        const list = db.getLeads().filter(l => l.id !== id);
        db.saveLeads(list);
        set({ leads: list, error: '删除失败，已在本地移除' });
      });
  },
  analyzeLead: (data) => api.analyzeLead(data).catch(() => null),

  // Pipeline
  pipeline: db.getPipeline(),
  loadPipeline: () => {
    set({ loading: true, error: null });
    return api.getPipeline()
      .then(data => {
        const list = data.pipeline || data || [];
        db.savePipeline(list);
        set({ pipeline: list, loading: false });
      })
      .catch(() => {
        set({ pipeline: db.getPipeline(), loading: false, error: '加载管道失败，使用本地数据' });
      });
  },
  addPipelineDeal: (deal) => {
    set({ loading: true, error: null });
    return api.createPipelineDeal(deal)
      .then(data => {
        const saved = data.deal || data;
        const list = db.getPipeline();
        list.push(saved);
        db.savePipeline(list);
        set({ pipeline: list, loading: false });
        return saved;
      })
      .catch(() => {
        const list = db.getPipeline();
        deal.id = Date.now();
        list.push(deal);
        db.savePipeline(list);
        set({ pipeline: list, loading: false, error: '保存失败，已存入本地' });
      });
  },
  updatePipelineDeal: (id, updates) => {
    set({ loading: true, error: null });
    return api.updatePipelineDeal(id, updates)
      .then(data => {
        const saved = data.deal || data;
        const list = db.getPipeline();
        const idx = list.findIndex(d => d.id === id);
        if (idx >= 0) { list[idx] = { ...list[idx], ...saved }; db.savePipeline(list); }
        set({ pipeline: list, loading: false });
        return saved;
      })
      .catch(() => {
        const list = db.getPipeline();
        const idx = list.findIndex(d => d.id === id);
        if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; db.savePipeline(list); }
        set({ pipeline: list, loading: false, error: '更新失败，已存入本地' });
      });
  },
  deletePipelineDeal: (id) => {
    return api.deletePipelineDeal(id)
      .then(() => {
        const list = db.getPipeline().filter(d => d.id !== id);
        db.savePipeline(list);
        set({ pipeline: list });
      })
      .catch(() => {
        const list = db.getPipeline().filter(d => d.id !== id);
        db.savePipeline(list);
        set({ pipeline: list, error: '删除失败，已在本地移除' });
      });
  },
  getPipelineForecast: () => api.getPipelineForecast().catch(() => null),

  // Content
  content: db.getContent(),
  loadContent: () => {
    set({ loading: true, error: null });
    return api.getContent()
      .then(data => {
        const list = data.content || data || [];
        db.saveContent(list);
        set({ content: list, loading: false });
      })
      .catch(() => {
        set({ content: db.getContent(), loading: false, error: '加载内容失败，使用本地数据' });
      });
  },
  createContent: (contentData) => {
    set({ loading: true, error: null });
    return api.createContent(contentData)
      .then(data => {
        const saved = data.content || data;
        const list = db.getContent();
        list.push(saved);
        db.saveContent(list);
        set({ content: list, loading: false });
      })
      .catch(() => {
        const list = db.getContent();
        contentData.id = Date.now();
        list.push(contentData);
        db.saveContent(list);
        set({ content: list, loading: false, error: '保存失败，已存入本地' });
      });
  },
  updateContent: (id, updates) => {
    return api.updateContent(id, updates)
      .then(data => {
        const list = db.getContent();
        const idx = list.findIndex(c => c.id === id);
        if (idx >= 0) { list[idx] = { ...list[idx], ...(data.content || updates) }; db.saveContent(list); }
        set({ content: list });
      })
      .catch(() => {
        const list = db.getContent();
        const idx = list.findIndex(c => c.id === id);
        if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; db.saveContent(list); }
        set({ content: list, error: '更新失败，已存入本地' });
      });
  },
  deleteContent: (id) => {
    return api.deleteContent(id)
      .then(() => {
        const list = db.getContent().filter(c => c.id !== id);
        db.saveContent(list);
        set({ content: list });
      })
      .catch(() => {
        const list = db.getContent().filter(c => c.id !== id);
        db.saveContent(list);
        set({ content: list, error: '删除失败，已在本地移除' });
      });
  },

  // Dashboard
  dashboard: db.getDashboard(),
  loadDashboard: () => {
    set({ loading: true, error: null });
    return api.getDashboard()
      .then(data => {
        const dash = data.dashboard || data;
        db.saveDashboard(dash);
        set({ dashboard: dash, loading: false });
      })
      .catch(() => {
        set({ dashboard: db.getDashboard(), loading: false, error: '加载仪表盘失败' });
      });
  },

  // Auth
  user: JSON.parse(localStorage.getItem('growth_os_user') || 'null'),
  login: (userData) => {
    localStorage.setItem('growth_os_user', JSON.stringify(userData));
    set({ user: userData });
  },
  logout: () => {
    localStorage.removeItem('growth_os_user');
    localStorage.removeItem('token');
    set({ user: null });
  },

  // AI actions (delegate to api directly)
  generateAIContent: (data) => api.generateAIContent(data).catch(() => null),
  analyzeCustomer: (data) => api.analyzeCustomer(data).catch(() => null),
  recommendProducts: (data) => api.recommendProducts(data).catch(() => null),
  generateScript: (data) => api.generateScript(data).catch(() => null),
}));

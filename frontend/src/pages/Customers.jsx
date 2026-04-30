import { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import Card from '../components/Card';
import { api } from '../api/client';
import { useGamification } from '../context/GamificationContext';

const STATUSES = ['线索', '意向', '谈判', '成交'];

const STATUS_COLORS = {
  '线索': '#71717a',
  '意向': '#3b82f6',
  '谈判': '#f59e0b',
  '成交': '#22c55e',
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', phone: '', status: '线索', amount: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showXpToast, loadXp, loadTasks } = useGamification();

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const data = await api.getCustomers();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Load customers error:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter(
    (c) => c.name.includes(search) || c.company.includes(search)
  );

  function openNew() {
    setEditCustomer(null);
    setForm({ name: '', company: '', phone: '', status: '线索', amount: '', notes: '' });
    setShowModal(true);
  }

  function openEdit(c) {
    setEditCustomer(c);
    setForm({
      name: c.name,
      company: c.company || '',
      phone: c.phone || '',
      status: c.status,
      amount: c.amount ? String(c.amount) : '',
      notes: c.notes || '',
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        company: form.company,
        phone: form.phone,
        status: form.status,
        amount: form.amount ? Number(form.amount) : 0,
        notes: form.notes,
      };

      if (editCustomer) {
        if (form.status !== editCustomer.status && form.status === '成交') {
          payload.amount = form.amount ? Number(form.amount) : editCustomer.amount;
          payload.status = '成交';
        } else if (form.status !== editCustomer.status) {
          payload.status = form.status;
        }
        payload.name = form.name;
        payload.company = form.company;
        payload.phone = form.phone;
        payload.notes = form.notes;
        if (form.amount) payload.amount = Number(form.amount);

        const data = await api.updateCustomer(editCustomer.id, payload);
        if (data.xp) showXpToast(data.xp);
      } else {
        const data = await api.createCustomer(payload);
        if (data.xp) showXpToast(data.xp);
      }

      setShowModal(false);
      loadCustomers();
      loadXp();
      loadTasks();
    } catch (err) {
      console.error('Submit customer error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 pt-5 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>客户</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#ffffff', minHeight: 36 }}
        >
          <Plus size={16} />
          新增
        </button>
      </div>

      <div
        className="flex items-center gap-2 rounded-xl px-3 mb-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', height: 44 }}
      >
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="搜索客户名称或公司..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, height: '100%', background: 'transparent', border: 'none',
            outline: 'none', color: 'var(--text-primary)', fontSize: 14,
          }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : (
        <Card>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              {search ? '未找到匹配客户' : '暂无客户，点击右上角新增'}
            </div>
          ) : (
            filtered.map((c, i) => (
              <div
                key={c.id}
                onClick={() => openEdit(c)}
                className="flex items-center gap-3 active:opacity-60 transition-opacity cursor-pointer"
                style={{
                  minHeight: 56,
                  padding: '10px 0',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${STATUS_COLORS[c.status]}20`,
                        color: STATUS_COLORS[c.status],
                        fontSize: 11,
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{c.company || '未填公司'}</div>
                </div>
                <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  ¥{Number(c.amount).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full rounded-t-2xl p-5 animate-scale-up"
            style={{ background: 'var(--bg-card)', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
                {editCustomer ? '编辑客户' : '新增客户'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>客户名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="输入客户名称"
                  className="w-full rounded-xl px-3"
                  style={{ height: 44, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>公司</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="输入公司名称"
                  className="w-full rounded-xl px-3"
                  style={{ height: 44, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>电话</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="输入联系电话"
                  className="w-full rounded-xl px-3"
                  style={{ height: 44, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>状态</label>
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setForm({ ...form, status: s })}
                      className="px-3 py-1.5 rounded-full text-sm"
                      style={{
                        background: form.status === s ? STATUS_COLORS[s] : 'var(--bg-primary)',
                        color: form.status === s ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${form.status === s ? STATUS_COLORS[s] : 'var(--border-color)'}`,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>金额</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="输入金额"
                  className="w-full rounded-xl px-3"
                  style={{ height: 44, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="备注信息"
                  rows={3}
                  className="w-full rounded-xl p-3 resize-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name.trim()}
                className="w-full rounded-xl py-3 text-sm font-medium mt-2 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#ffffff' }}
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

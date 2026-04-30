import { useState, useEffect } from 'react';
import { Plus, Phone, MessageSquare, Mail, Users } from 'lucide-react';
import { api } from '../api/client';
import { useGamification } from '../context/GamificationContext';

const TYPE_CONFIG = {
  '电话': { icon: Phone, color: '#22c55e' },
  '微信': { icon: MessageSquare, color: '#3b82f6' },
  '面谈': { icon: Users, color: '#8b5cf6' },
  '报价': { icon: Mail, color: '#f59e0b' },
  '其他': { icon: MessageSquare, color: '#71717a' },
};

export default function Timeline() {
  const [groups, setGroups] = useState({ today: [], yesterday: [], earlier: [] });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customer_id: '', type: '电话', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showXpToast } = useGamification();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [timelineData, custData] = await Promise.all([
        api.getTimelineGrouped(),
        api.getCustomers(),
      ]);
      setGroups(timelineData.groups || { today: [], yesterday: [], earlier: [] });
      setCustomers((custData.customers || []).filter(c => c.status !== '成交'));
    } catch (err) {
      console.error('Load timeline error:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({ customer_id: '', type: '电话', content: '' });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.customer_id || !form.content.trim()) return;
    setSubmitting(true);

    try {
      const data = await api.createTimeline({
        customer_id: Number(form.customer_id),
        type: form.type,
        content: form.content,
      });

      if (data.xp) showXpToast(data.xp);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Create timeline error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function renderGroup(title, records) {
    if (!records || records.length === 0) return null;

    return (
      <div className="mb-5">
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 4 }}>
          {title}
        </div>

        <div className="relative pl-6">
          <div className="absolute left-[11px] top-1 bottom-0" style={{ width: 1.5, background: 'var(--border-color)' }} />

          {records.map((item, i) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG['其他'];
            const Icon = config.icon;
            return (
              <div key={item.id || i} className="relative pb-4 last:pb-0">
                <div
                  className="absolute left-[-16px] top-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-primary)', border: `2px solid ${config.color}` }}
                >
                  <Icon size={10} style={{ color: config.color }} />
                </div>

                <div className="rounded-xl p-3.5 ml-1" style={{ background: 'var(--bg-card)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {item.customer_name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs"
                      style={{
                        background: `${config.color}20`,
                        color: config.color,
                        fontSize: 10,
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>跟进</h1>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : (
        <>
          {renderGroup('今天', groups.today)}
          {renderGroup('昨天', groups.yesterday)}
          {renderGroup('更早', groups.earlier)}

          {(!groups.today || groups.today.length === 0) &&
           (!groups.yesterday || groups.yesterday.length === 0) &&
           (!groups.earlier || groups.earlier.length === 0) && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              暂无跟进记录
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40"
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent)', right: 20, bottom: 84,
        }}
      >
        <Plus size={24} style={{ color: '#ffffff' }} />
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full rounded-t-2xl p-5 animate-scale-up"
            style={{ background: 'var(--bg-card)', maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              记录沟通
            </h3>

            <div style={{ marginBottom: 12 }}>
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full rounded-xl px-3"
                style={{
                  height: 44, background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}
              >
                <option value="">选择客户</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.company || c.status}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="flex gap-2">
                {['电话', '微信', '面谈', '报价', '其他'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className="px-3 py-1.5 rounded-full text-sm"
                    style={{
                      background: form.type === t ? 'var(--accent)' : 'var(--bg-primary)',
                      color: form.type === t ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="输入沟通内容..."
                rows={4}
                className="w-full rounded-xl p-3 resize-none"
                style={{
                  background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !form.customer_id || !form.content.trim()}
              className="w-full rounded-xl py-3 text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              {submitting ? '保存中...' : '保存 (+10 XP)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

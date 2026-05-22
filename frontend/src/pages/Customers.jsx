import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useStore } from '../store/useStore';

const STAGES = ['lead', 'interested', 'quoted', 'negotiating', 'closed'];
const STAGE_LABELS = { lead: '线索', interested: '意向', quoted: '报价', negotiating: '谈判', closed: '成交' };
const STAGE_COLORS = { lead: '#64748B', interested: '#3B82F6', quoted: '#F59E0B', negotiating: '#1F6FEB', closed: '#22C55E' };

export default function Customers() {
  const customers = useStore((s) => s.customers);
  const addCustomer = useStore((s) => s.addCustomer);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const deleteCustomer = useStore((s) => s.deleteCustomer);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', industry: 'tech', stage: 'lead', amount: '', tags: '', notes: '' });

  const filtered = customers.filter((c) =>
    c.name.includes(search) || (c.industry || '').includes(search)
  );

  function openNew() {
    setEditing(null);
    setForm({ name: '', industry: 'tech', stage: 'lead', amount: '', tags: '', notes: '' });
    setShowModal(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      name: c.name, industry: c.industry || 'tech', stage: c.stage,
      amount: String(c.amount || ''), tags: (c.tags || []).join(', '), notes: c.notes || '',
    });
    setShowModal(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name, industry: form.industry, stage: form.stage,
      amount: Number(form.amount) || 0, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes, score: 0, last_follow: new Date().toISOString().split('T')[0],
    };
    if (editing) {
      updateCustomer(editing.id, payload);
    } else {
      addCustomer(payload);
    }
    setShowModal(false);
  }

  function formatMoney(val) {
    const num = Number(val);
    if (num >= 10000) return `¥${(num / 10000).toFixed(1)}万`;
    return `¥${num.toLocaleString()}`;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E2E8F0' }}>客户管理</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>CRM · 共 {customers.length} 个客户</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#1F6FEB', color: '#FFF' }}
        >
          <Plus size={16} /> 新增客户
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl px-4 mb-6" style={{ background: '#121826', border: '1px solid #1E293B', height: 44, maxWidth: 400 }}>
        <Search size={16} style={{ color: '#64748B' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索客户..."
          className="flex-1 bg-transparent border-none text-sm"
          style={{ color: '#E2E8F0' }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#121826', border: '1px solid #1E293B' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#64748B' }}>
            <UsersIcon size={40} className="mx-auto mb-3" style={{ color: '#64748B' }} />
            <p>{search ? '未找到匹配客户' : '暂无客户数据'}</p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B' }}>
                {['客户名称', '行业', '阶段', '金额', '评分', '最后跟进', '操作'].map(h => (
                  <th key={h} className="text-left text-xs font-medium py-3 px-4" style={{ color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1E293B' : 'none' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: '#1F6FEB', color: '#FFF' }}>{c.name[0]}</div>
                      <span className="text-sm" style={{ color: '#E2E8F0' }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#94A3B8' }}>{c.industry || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${STAGE_COLORS[c.stage]}20`, color: STAGE_COLORS[c.stage] }}>
                      {STAGE_LABELS[c.stage] || c.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#E2E8F0' }}>{formatMoney(c.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: '#1E293B' }}>
                        <div className="h-full rounded-full" style={{ width: `${c.score || 50}%`, background: (c.score || 50) >= 80 ? '#22C55E' : (c.score || 50) >= 60 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{c.score || 50}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#64748B' }}>{c.last_follow || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(c)} className="text-xs px-2 py-1 rounded" style={{ color: '#1F6FEB' }}>编辑</button>
                    <button onClick={() => deleteCustomer(c.id)} className="text-xs px-2 py-1 rounded ml-1" style={{ color: '#EF4444' }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: '#121826', border: '1px solid #1E293B' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium" style={{ color: '#E2E8F0' }}>{editing ? '编辑客户' : '新增客户'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#64748B' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: '客户名称', key: 'name', type: 'text' },
                { label: '金额', key: 'amount', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs mb-1.5" style={{ color: '#94A3B8' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full rounded-lg px-3 text-sm" style={{ height: 40, background: '#0B0F1A', border: '1px solid #1E293B', color: '#E2E8F0' }} />
                </div>
              ))}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#94A3B8' }}>行业</label>
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full rounded-lg px-3 text-sm" style={{ height: 40, background: '#0B0F1A', border: '1px solid #1E293B', color: '#E2E8F0' }}>
                  <option value="tech">科技</option>
                  <option value="manufacturing">制造业</option>
                  <option value="finance">金融</option>
                  <option value="healthcare">医疗</option>
                  <option value="education">教育</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#94A3B8' }}>阶段</label>
                <div className="flex gap-2 flex-wrap">
                  {STAGES.map(s => (
                    <button key={s} onClick={() => setForm({ ...form, stage: s })}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{ background: form.stage === s ? STAGE_COLORS[s] : '#0B0F1A', color: form.stage === s ? '#FFF' : '#94A3B8', border: `1px solid ${form.stage === s ? STAGE_COLORS[s] : '#1E293B'}` }}>
                      {STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#94A3B8' }}>标签（逗号分隔）</label>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full rounded-lg px-3 text-sm" style={{ height: 40, background: '#0B0F1A', border: '1px solid #1E293B', color: '#E2E8F0' }} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#94A3B8' }}>备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full rounded-lg p-3 text-sm resize-none"
                  style={{ background: '#0B0F1A', border: '1px solid #1E293B', color: '#E2E8F0' }} />
              </div>
              <button onClick={handleSubmit} disabled={!form.name.trim()}
                className="w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
                style={{ background: '#1F6FEB', color: '#FFF' }}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Local import for empty state icon
function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

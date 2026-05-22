import { useState } from 'react';
import { User, Bell, Shield, HelpCircle, FileText, LogOut, ChevronRight, TrendingUp, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db } from '../lib/db';

const settings = [
  { icon: Bell, label: '消息通知', desc: '管理推送提醒' },
  { icon: Shield, label: '隐私与安全', desc: '账号安全设置' },
  { icon: FileText, label: '数据导出', desc: '导出客户与报表' },
  { icon: HelpCircle, label: '帮助与反馈', desc: '常见问题与意见' },
];

export default function Profile() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const customers = useStore((s) => s.customers);
  const pipeline = useStore((s) => s.pipeline);
  const [resetting, setResetting] = useState(false);

  const totalCustomers = customers.length;
  const totalPipeline = pipeline.reduce((sum, p) => sum + p.amount, 0);
  const closedDeals = pipeline.filter((p) => p.stage === 'closed').length;
  const activeDeals = pipeline.filter((p) => p.stage !== 'closed').length;

  function handleLogout() {
    logout();
  }

  function handleReset() {
    db.resetAll();
    setResetting(true);
    setTimeout(() => window.location.reload(), 500);
  }

  function formatMoney(val) {
    const num = Number(val);
    if (num >= 10000) return `¥${(num / 10000).toFixed(1)}万`;
    return `¥${num.toLocaleString()}`;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#E2E8F0' }}>我的</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>个人中心与系统设置</p>
      </div>

      {/* User Info Card */}
      <div className="flex items-center gap-4 p-5 rounded-xl mb-6" style={{ background: '#121826', border: '1px solid #1E293B' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0" style={{ background: '#1F6FEB', color: '#FFF' }}>
          {user?.name ? user.name[0] : 'U'}
        </div>
        <div>
          <div className="text-base font-medium" style={{ color: '#E2E8F0' }}>{user?.name || '用户'}</div>
          <div className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{user?.role || '管理员'}</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs" style={{ color: '#64748B' }}>
              <TrendingUp size={12} /> {totalCustomers} 客户
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#64748B' }}>
              <TrendingUp size={12} /> {activeDeals} 进行中
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '客户总数', value: totalCustomers, color: '#3B82F6' },
          { label: '管道总额', value: formatMoney(totalPipeline), color: '#22C55E' },
          { label: '成交单数', value: closedDeals, color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ background: '#121826', border: '1px solid #1E293B' }}>
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: '#64748B' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: '#121826', border: '1px solid #1E293B' }}>
        {settings.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i}
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderBottom: i < settings.length - 1 ? '1px solid #1E293B' : 'none' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#0B0F1A' }}>
                <Icon size={16} style={{ color: '#94A3B8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: '#E2E8F0' }}>{item.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{item.desc}</div>
              </div>
              <ChevronRight size={16} style={{ color: '#64748B' }} />
            </div>
          );
        })}
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: '#121826', border: '1px solid #1E293B' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: '#1E293B' }}>
          <span className="text-xs font-medium" style={{ color: '#EF4444' }}>危险区域</span>
        </div>
        <button onClick={handleReset} disabled={resetting}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:opacity-80 transition-opacity"
          style={{ color: '#EF4444' }}>
          <LogOut size={16} />
          <span className="text-sm">{resetting ? '重置中...' : '重置所有数据'}</span>
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:opacity-80 transition-opacity"
          style={{ color: '#EF4444', borderTop: '1px solid #1E293B' }}>
          <LogOut size={16} />
          <span className="text-sm">退出登录</span>
        </button>
      </div>

      <p className="text-center text-xs" style={{ color: '#64748B' }}>Growth OS v1.0 · 本地数据存储</p>
    </div>
  );
}

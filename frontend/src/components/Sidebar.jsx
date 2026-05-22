import {
  LayoutDashboard, TrendingUp, Library, Users as UsersIcon,
  Package, UserCheck, GitPullRequest, Brain, User,
} from 'lucide-react';
import { useStore } from '../store/useStore';

const tabs = [
  { key: 'dashboard', label: '驾驶舱', icon: LayoutDashboard },
  { key: 'growth', label: '增长中心', icon: TrendingUp },
  { key: 'content', label: '内容库', icon: Library },
  { key: 'leads', label: '线索中心', icon: UsersIcon },
  { key: 'products', label: '产品库', icon: Package },
  { key: 'customers', label: '客户', icon: UserCheck },
  { key: 'pipeline', label: '成交', icon: GitPullRequest },
  { key: 'ai', label: 'AI中心', icon: Brain },
  { key: 'profile', label: '我的', icon: User },
];

export default function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const user = useStore((s) => s.user);

  return (
    <aside className="flex flex-col h-full shrink-0 border-r" style={{
      width: 200, background: '#0D1117', borderColor: '#1E293B',
    }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 shrink-0 border-b" style={{ borderColor: '#1E293B' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1F6FEB' }}>
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>Growth OS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all"
              style={{
                background: isActive ? '#1F6FEB' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#1A2035';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="shrink-0 border-t px-4 py-3" style={{ borderColor: '#1E293B' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: '#1F6FEB', color: '#FFF' }}>
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs truncate" style={{ color: '#E2E8F0' }}>{user?.name || '用户'}</div>
            <div className="text-xs" style={{ color: '#64748B' }}>{user?.role || '管理员'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

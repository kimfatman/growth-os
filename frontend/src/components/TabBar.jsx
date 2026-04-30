import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, Target, User } from 'lucide-react';

const tabs = [
  { path: '/', label: '首页', icon: LayoutDashboard },
  { path: '/customers', label: '客户', icon: Users },
  { path: '/timeline', label: '跟进', icon: Clock },
  { path: '/target', label: '目标', icon: Target },
  { path: '/profile', label: '我的', icon: User },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const shouldShow = !['/login', '/register'].includes(location.pathname);

  if (!shouldShow) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around z-50"
      style={{
        height: 64,
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-center gap-0.5 transition-colors duration-150"
            style={{
              width: 56,
              height: 48,
              minHeight: 44,
              color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 500 : 400, lineHeight: 1 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

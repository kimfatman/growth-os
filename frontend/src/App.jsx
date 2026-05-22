import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Growth from './pages/Growth';
import Content from './pages/Content';
import Leads from './pages/Leads';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Pipeline from './pages/Pipeline';
import AICenter from './pages/AICenter';
import Profile from './pages/Profile';
import Login from './pages/Login';

const pages = {
  dashboard: Dashboard,
  growth: Growth,
  content: Content,
  leads: Leads,
  products: Products,
  customers: Customers,
  pipeline: Pipeline,
  ai: AICenter,
  profile: Profile,
};

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const user = useStore((s) => s.user);
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);

  if (!user) return <Login />;

  const Page = pages[activeTab] || Dashboard;

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {error && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm shadow-lg animate-in">
            <span>{error}</span>
            <button onClick={clearError} className="ml-2 hover:text-red-300 cursor-pointer">✕</button>
          </div>
        )}
        <Page />
      </main>
    </div>
  );
}

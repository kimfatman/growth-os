import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useGamification } from './context/GamificationContext';
import TabBar from './components/TabBar';
import XpToast from './components/XpToast';
import Home from './pages/Home';
import Customers from './pages/Customers';
import Timeline from './pages/Timeline';
import Target from './pages/Target';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  const { loadXp, loadTasks } = useGamification();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadXp();
      loadTasks();
    }
  }, [user, loadXp, loadTasks]);

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <XpToast />

      {!isAuthPage && user && (
        <div className="flex-1 overflow-y-auto pb-[64px]">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
            <Route path="/target" element={<ProtectedRoute><Target /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      )}

      {isAuthPage && (
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      )}

      {!isAuthPage && user && <TabBar />}
    </div>
  );
}

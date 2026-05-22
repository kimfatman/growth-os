import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const [xpInfo, setXpInfo] = useState({ total_xp: 0, level: 1, nextLevelXp: 100, currentXp: 0 });
  const [tasks, setTasks] = useState([]);
  const [toast, setToast] = useState(null);

  const loadXp = useCallback(async () => {
    try {
      const data = await api.getXp();
      setXpInfo(data);
    } catch {}
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const { tasks } = await api.getTasks();
      setTasks(tasks);
    } catch {}
  }, []);

  const showXpToast = useCallback((xpData) => {
    if (!xpData) return;
    setToast({
      xp: xpData.xpGained || 0,
      reason: xpData.reason || '',
      leveledUp: xpData.leveledUp || false,
      level: xpData.level,
      id: Date.now(),
    });
    loadXp();
    loadTasks();

    setTimeout(() => setToast(null), 2500);
  }, [loadXp, loadTasks]);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <GamificationContext.Provider value={{ xpInfo, tasks, toast, loadXp, loadTasks, showXpToast, dismissToast }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within GamificationProvider');
  return context;
}

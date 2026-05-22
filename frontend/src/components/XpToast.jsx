import { useGamification } from '../context/GamificationContext';
import { Zap, Award } from 'lucide-react';

export default function XpToast() {
  const { toast, dismissToast } = useGamification();

  if (!toast) return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 z-[100] animate-slide-down"
      style={{ maxWidth: 400, margin: '0 auto' }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
        style={{
          background: toast.leveledUp
            ? 'linear-gradient(135deg, #7c3aed, #3b82f6)'
            : 'var(--bg-card)',
          border: `1px solid ${toast.leveledUp ? '#7c3aed' : 'var(--border-color)'}`,
        }}
      >
        {toast.leveledUp ? (
          <Award size={24} style={{ color: '#fbbf24', flexShrink: 0 }} />
        ) : (
          <Zap size={20} style={{ color: '#fbbf24', flexShrink: 0 }} />
        )}

        <div className="flex-1 min-w-0">
          {toast.leveledUp ? (
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
              升级！Lv.{toast.level}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                +{toast.xp} XP
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                {toast.reason}
              </div>
            </>
          )}
        </div>

        <button
          onClick={dismissToast}
          className="text-xs opacity-60 hover:opacity-100"
          style={{ color: toast.leveledUp ? '#ffffff' : 'var(--text-muted)' }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

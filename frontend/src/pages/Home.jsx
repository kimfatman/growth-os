import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Users, Zap, Target, Lightbulb, ChevronRight, Award, Flame } from 'lucide-react';
import Card from '../components/Card';
import ListItem from '../components/ListItem';
import { api } from '../api/client';
import { useGamification } from '../context/GamificationContext';

export default function Home() {
  const navigate = useNavigate();
  const { xpInfo, tasks } = useGamification();
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, suggestData] = await Promise.all([
        api.getCustomerStats(),
        api.getAISuggestions().catch(() => ({ suggestions: [], summary: '' })),
      ]);
      setStats(statsData.stats || statsData);
      setSuggestions(suggestData);
    } catch (err) {
      console.error('Load home data error:', err);
    } finally {
      setLoading(false);
    }
  }

  const progressPercent = xpInfo.nextLevelXp > 0
    ? Math.min((xpInfo.currentXp / xpInfo.nextLevelXp) * 100, 100)
    : 0;

  function formatMoney(val) {
    const num = Number(val);
    if (num >= 10000) return `¥${(num / 10000).toFixed(1)}万`;
    return `¥${num.toLocaleString()}`;
  }

  if (loading) {
    return (
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="mb-4">
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Growth OS</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>AI 销售增长系统</p>
      </div>

      {/* Level & XP Card */}
      <Card className="mb-3" style={{ background: 'linear-gradient(135deg, #1e1b4b, #18181b)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award size={18} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fbbf24' }}>Lv.{xpInfo.level}</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {xpInfo.currentXp} / {xpInfo.nextLevelXp} XP
          </span>
        </div>

        <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
          />
        </div>
      </Card>

      {/* Today's Tasks */}
      {tasks.length > 0 && (
        <Card className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} style={{ color: '#f97316' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>今日任务</span>
          </div>
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < tasks.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {task.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {task.progress}/{task.target}
                  </span>
                </div>
                <div className="w-full rounded-full overflow-hidden mt-1" style={{ height: 4, background: 'var(--bg-primary)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((task.progress / task.target) * 100, 100)}%`,
                      background: task.completed ? 'var(--success)' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                +{task.xp_reward} XP
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="flex gap-3 mb-3">
        <Card className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign size={14} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>今日营收</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats ? formatMoney(stats.today_revenue || 0) : '¥0'}
          </div>
        </Card>
        <Card className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>管道总额</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats ? formatMoney(stats.pipeline_value || 0) : '¥0'}
          </div>
        </Card>
      </div>

      <div className="flex gap-3 mb-3">
        <Card className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Users size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>总客户</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.total || 0}</div>
        </Card>
        <Card className="flex-1" onClick={() => navigate('/target')}>
          <div className="flex items-center gap-1.5 mb-2">
            <Target size={14} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>成交</span>
          </div>
          <div className="flex items-center gap-1">
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.closed_deals || 0}</div>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        </Card>
      </div>

      {/* AI Suggestions */}
      {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 && (
        <Card className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>AI 优先跟进建议</span>
          </div>
          {suggestions.suggestions.slice(0, 3).map((s, i) => (
            <div key={i} className="py-2" style={{ borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{
                  fontSize: 11,
                  color: '#ffffff',
                  background: s.priority === '高' ? '#ef4444' : s.priority === '中' ? '#f59e0b' : '#3b82f6',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}>
                  {s.priority}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{s.customerName}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.action}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.reason}</div>
            </div>
          ))}
        </Card>
      )}

      {/* XP Log quick view */}
      <Card onClick={() => navigate('/profile')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>经验值明细</span>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, Shield, HelpCircle, FileText, LogOut, Award, Zap, Flame, Trophy, Star } from 'lucide-react';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { api } from '../api/client';

const ACHIEVEMENT_LABELS = {
  'first_deal': { icon: Star, label: '首单成交 🎉', desc: '完成第一笔成交' },
  'ten_deals': { icon: Trophy, label: '成交10单 💪', desc: '累计完成10单成交' },
  'seven_day_streak': { icon: Flame, label: '连续跟进7天 🔥', desc: '连续7天有跟进活动' },
  'xp_hunter': { icon: Zap, label: '经验猎人 ⚡', desc: '24小时内获得大量经验' },
};

const settings = [
  { icon: Bell, label: '消息通知', desc: '管理推送提醒' },
  { icon: Shield, label: '隐私与安全', desc: '账号安全设置' },
  { icon: FileText, label: '数据导出', desc: '导出客户与报表' },
  { icon: HelpCircle, label: '帮助与反馈', desc: '常见问题与意见' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { xpInfo } = useGamification();
  const [xpLogs, setXpLogs] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [logData, achData] = await Promise.all([
        api.getXpLog().catch(() => ({ logs: [] })),
        api.getAchievements().catch(() => ({ achievements: [] })),
      ]);
      setXpLogs(logData.logs || []);
      setAchievements(achData.achievements || []);
    } catch (err) {
      console.error('Load profile data error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const progressPercent = xpInfo.nextLevelXp > 0
    ? Math.min((xpInfo.currentXp / xpInfo.nextLevelXp) * 100, 100)
    : 0;

  const LEVEL_NAMES = ['', '初级销售', '销售精英', '销售专家', '销售经理', '高级经理', '销售总监', '区域总监', '副总裁', '高级副总裁', '销售总裁'];

  return (
    <div className="px-4 pt-5 pb-4">
      {/* User Info */}
      <div className="flex items-center gap-4 mb-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0"
          style={{ background: 'var(--accent)', color: '#ffffff' }}
        >
          {user?.name ? user.name[0] : 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || '用户'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 1 }}>
            {LEVEL_NAMES[xpInfo.level] || `Lv.${xpInfo.level}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email || ''}</div>
        </div>
      </div>

      {/* Level & XP */}
      <Card className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award size={18} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fbbf24' }}>Lv.{xpInfo.level}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {LEVEL_NAMES[xpInfo.level] || ''}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            总计 {xpInfo.total_xp} XP
          </span>
        </div>

        <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'var(--bg-primary)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
          />
        </div>
        <div className="text-right mt-1">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {xpInfo.currentXp} / {xpInfo.nextLevelXp} XP 到下一级
          </span>
        </div>
      </Card>

      {/* Achievements */}
      <div className="mb-3">
        <h2 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10 }}>
          成就 {achievements.length > 0 && `(${achievements.length})`}
        </h2>
        <Card>
          {achievements.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
              继续努力，完成更多任务解锁成就！
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {achievements.map((ach) => {
                const config = ACHIEVEMENT_LABELS[ach.code] || { icon: Award, label: ach.title, desc: '' };
                const Icon = config.icon;
                return (
                  <div key={ach.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                    <Icon size={16} style={{ color: '#fbbf24' }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{config.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{config.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* XP History */}
      <div className="mb-3">
        <h2 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10 }}>最近经验记录</h2>
        <Card>
          {xpLogs.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
              暂无经验记录
            </div>
          ) : (
            xpLogs.slice(0, 10).map((log, i) => (
              <div
                key={log.id || i}
                className="flex items-center gap-3 py-2"
                style={{ borderBottom: i < Math.min(xpLogs.length, 10) - 1 ? '1px solid var(--border-color)' : 'none' }}
              >
                <Zap size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <div className="flex-1">
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{log.reason}</span>
                </div>
                <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 500 }}>+{log.amount}</span>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Settings */}
      <Card className="mb-3">
        {settings.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3 active:opacity-70 transition-opacity cursor-pointer"
              style={{
                minHeight: 52, padding: '8px 0',
                borderBottom: i < settings.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-primary)' }}>
                <Icon size={16} style={{ color: 'var(--accent-light)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.desc}</div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          );
        })}
      </Card>

      {/* Logout */}
      <Card>
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 active:opacity-70 transition-opacity cursor-pointer"
          style={{ minHeight: 48, padding: '4px 0' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-primary)' }}>
            <LogOut size={16} style={{ color: 'var(--danger)' }} />
          </div>
          <span style={{ fontSize: 14, color: 'var(--danger)' }}>退出登录</span>
        </div>
      </Card>
    </div>
  );
}

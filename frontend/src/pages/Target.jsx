import { useState, useEffect } from 'react';
import { Target as TargetIcon, TrendingUp, MessageSquare, Users, Bot, DollarSign } from 'lucide-react';
import Card from '../components/Card';
import { api } from '../api/client';

export default function TargetPage() {
  const [targetData, setTargetData] = useState(null);
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    loadTarget();
  }, []);

  async function loadTarget() {
    try {
      const data = await api.getTarget();
      setTargetData(data.target);
      setCurrentRevenue(Number(data.current_revenue));
      if (data.target?.ai_breakdown) {
        setBreakdown(data.target.ai_breakdown);
      }
      if (data.target?.target_amount) {
        setAmount(String(data.target.target_amount));
      }
    } catch (err) {
      console.error('Load target error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!amount || Number(amount) <= 0) return;
    setAnalyzing(true);

    try {
      const data = await api.analyzeTarget({ target_amount: Number(amount) });
      setBreakdown(data.breakdown);
      setTargetData({ target_amount: data.target_amount });
      setCurrentRevenue(Number(data.current_revenue));
    } catch (err) {
      console.error('Analyze error:', err);
    } finally {
      setAnalyzing(false);
    }
  }

  function formatMoney(val) {
    const num = Number(val);
    if (num >= 10000) return `¥${(num / 10000).toFixed(1)}万`;
    return `¥${num.toLocaleString()}`;
  }

  const targetAmount = targetData?.target_amount || 0;
  const progress = targetAmount > 0 ? Math.min((currentRevenue / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(targetAmount - currentRevenue, 0);

  const breakdownItems = breakdown ? [
    { label: '成交数', value: `${breakdown.dealsNeeded || 0} 单`, icon: TrendingUp, color: '#22c55e' },
    { label: '线索量', value: `${breakdown.leadsNeeded || 0} 条`, icon: MessageSquare, color: '#3b82f6' },
    { label: '意向客户', value: `${breakdown.intentNeeded || 0} 人`, icon: Users, color: '#f59e0b' },
    { label: '谈判中', value: `${breakdown.negotiationNeeded || 0} 人`, icon: TargetIcon, color: '#8b5cf6' },
  ] : null;

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>目标</h1>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : (
        <>
          {/* Target Card */}
          <Card className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>本月目标</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="输入目标金额"
                className="flex-1 rounded-xl px-3"
                style={{
                  height: 44, background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                  fontSize: 16, fontWeight: 600, outline: 'none',
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !amount || Number(amount) <= 0}
                className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                style={{ background: 'var(--accent)', color: '#ffffff', height: 44 }}
              >
                {analyzing ? '分析中...' : 'AI拆解'}
              </button>
            </div>

            {targetAmount > 0 && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>目标 {formatMoney(targetAmount)}</span>
                  <span style={{ fontSize: 13, color: 'var(--accent)' }}>{progress.toFixed(0)}%</span>
                </div>

                <div className="w-full rounded-full overflow-hidden mb-3" style={{ height: 8, background: 'var(--bg-primary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
                    }}
                  />
                </div>

                <div className="flex justify-between">
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>已完成</span>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--success)', marginTop: 1 }}>
                      {formatMoney(currentRevenue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>剩余</span>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 1 }}>
                      {formatMoney(remaining)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* AI Breakdown */}
          {breakdown && (
            <Card className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>AI 拆解建议</span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                {breakdown.suggestion || `为实现目标，AI建议本月还需完成：`}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {breakdownItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="rounded-xl p-3" style={{ background: 'var(--bg-primary)' }}>
                      <Icon size={16} style={{ color: item.color, marginBottom: 6 }} />
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                  );
                })}
              </div>

              {breakdown.avgDealSize && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>平均客单价</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {formatMoney(breakdown.avgDealSize)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* No target state */}
          {!targetAmount && !breakdown && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              输入目标金额并点击「AI拆解」开始分析
            </div>
          )}
        </>
      )}
    </div>
  );
}

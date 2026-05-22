import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Target,
  Zap,
  ChevronRight,
  Brain,
  Package,
  UserCheck,
  GitPullRequest,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Theme tokens                                                      */
/* ------------------------------------------------------------------ */
const theme = {
  bg: '#0B0F1A',
  card: '#121826',
  border: '#1E293B',
  primary: '#1F6FEB',
  text: '#E2E8F0',
  secondary: '#94A3B8',
  muted: '#64748B',
};

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                   */
/* ------------------------------------------------------------------ */

/** Format a number as ¥X.XX万 (or ¥X for values below 1万). */
const formatMoney = (value) => {
  if (value == null || Number.isNaN(+value)) return '¥0';
  const num = +value;
  if (num >= 10000) {
    return `¥${(num / 10000).toFixed(2)}万`;
  }
  return `¥${num.toLocaleString('zh-CN')}`;
};

/** Format a percentage (e.g. 0.356 => "35.6%"). */
const formatPercent = (value) => {
  if (value == null || Number.isNaN(+value)) return '0%';
  return `${(+value * 100).toFixed(1)}%`;
};

/** Return a soft status colour based on a score (0‑100). */
const scoreColor = (score) => {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#EAB308';
  return '#EF4444';
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: theme.bg,
    color: theme.text,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    padding: '32px 40px',
  },

  /* Header --------------------------------------------------------- */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '28px',
    fontWeight: 700,
    color: theme.text,
    margin: 0,
    lineHeight: 1.2,
  },
  headerSubtitle: {
    fontSize: '14px',
    color: theme.secondary,
    margin: 0,
    fontWeight: 400,
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(31, 111, 235, 0.15)',
    color: theme.primary,
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    border: `1px solid rgba(31, 111, 235, 0.25)`,
  },

  /* Grid layouts --------------------------------------------------- */
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '28px',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '28px',
  },

  /* Cards ---------------------------------------------------------- */
  card: {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: theme.text,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: theme.secondary,
    margin: 0,
  },

  /* Stat card specifics -------------------------------------------- */
  statIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  statLabel: {
    fontSize: '13px',
    color: theme.secondary,
    margin: 0,
    marginBottom: '6px',
    fontWeight: 500,
  },
  statValue: {
    fontSize: '26px',
    fontWeight: 700,
    color: theme.text,
    margin: 0,
    lineHeight: 1.2,
  },
  statChange: {
    fontSize: '13px',
    margin: 0,
    marginTop: '6px',
    fontWeight: 600,
  },

  /* AI section ----------------------------------------------------- */
  aiCard: {
    backgroundColor: 'rgba(31, 111, 235, 0.06)',
    border: `1px solid rgba(31, 111, 235, 0.2)`,
    borderRadius: '10px',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  aiIconWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: 'rgba(31, 111, 235, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiContent: {
    flex: 1,
    minWidth: 0,
  },
  aiTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text,
    margin: 0,
    marginBottom: '4px',
  },
  aiDesc: {
    fontSize: '13px',
    color: theme.secondary,
    margin: 0,
    lineHeight: 1.5,
  },

  /* Customer list -------------------------------------------------- */
  customerItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: `1px solid ${theme.border}`,
  },
  customerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  customerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  customerName: {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text,
    margin: 0,
  },
  customerMeta: {
    fontSize: '12px',
    color: theme.secondary,
    margin: 0,
    marginTop: '2px',
  },
  scoreBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#fff',
  },

  /* Pipeline forecast ---------------------------------------------- */
  forecastRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
  },
  forecastLabel: {
    fontSize: '14px',
    color: theme.secondary,
    margin: 0,
  },
  forecastValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text,
    margin: 0,
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: theme.border,
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '16px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },

  /* Risk section --------------------------------------------------- */
  riskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: `1px solid ${theme.border}`,
  },
  riskReason: {
    fontSize: '12px',
    color: theme.secondary,
    margin: 0,
    marginTop: '2px',
  },

  /* View-all link -------------------------------------------------- */
  viewAll: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    fontWeight: 500,
    color: theme.primary,
    cursor: 'pointer',
    textDecoration: 'none',
    border: 'none',
    background: 'none',
    padding: 0,
  },
};

/* ================================================================== */
/*  Dashboard Component                                               */
/* ================================================================== */

const Dashboard = () => {
  const { dashboard, customers, pipeline, loadDashboard, loadCustomers, loadPipeline } = useStore();

  useEffect(() => {
    loadDashboard();
    if (!customers || customers.length === 0) loadCustomers();
    if (!pipeline || pipeline.length === 0) loadPipeline();
  }, []);

  /* ---- Derive properties from store data ---- */
  const {
    revenue_today = 0,
    conversion_rate = 0,
    high_value_customers: highValueCount = 0,
    risk_customers: riskCount = 0,
    forecast_amount = 0,
    active_deals = 0,
    new_leads_today = 0,
  } = dashboard || {};

  /* Top 3 high-value customers (score >= 80) */
  const topCustomers = Array.isArray(customers)
    ? customers
        .filter((c) => (c.score ?? 0) >= 80)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3)
    : [];

  /* Customers needing attention (risk flagged) */
  const riskCustomers = Array.isArray(customers)
    ? customers.filter((c) => c.risk === true || c.needs_attention === true)
    : [];

  /* ---- Stat card configuration ---- */
  const statCards = [
    {
      label: '今日收入',
      value: formatMoney(revenue_today),
      change: `昨日 +${new_leads_today} 新线索`,
      icon: <DollarSign size={20} strokeWidth={2.2} />,
      bg: 'rgba(34, 197, 94, 0.12)',
      color: '#22C55E',
    },
    {
      label: '转化率',
      value: formatPercent(conversion_rate),
      change: `${active_deals} 进行中商机`,
      icon: <TrendingUp size={20} strokeWidth={2.2} />,
      bg: 'rgba(31, 111, 235, 0.12)',
      color: '#1F6FEB',
    },
    {
      label: '高价值客户',
      value: highValueCount,
      change: '评分 80 分以上',
      icon: <Users size={20} strokeWidth={2.2} />,
      bg: 'rgba(168, 85, 247, 0.12)',
      color: '#A855F7',
    },
    {
      label: '风险客户',
      value: riskCount,
      change: '需立即跟进',
      icon: <AlertTriangle size={20} strokeWidth={2.2} />,
      bg: 'rgba(239, 68, 68, 0.12)',
      color: '#EF4444',
    },
  ];

  /* ---- AI recommended actions ---- */
  const aiActions = [
    {
      icon: <Brain size={18} strokeWidth={2} />,
      title: '跟进高价值客户',
      desc: '今日有 3 位高价值客户长时间未联系，建议优先安排跟进。',
    },
    {
      icon: <Target size={18} strokeWidth={2} />,
      title: '优化转化流程',
      desc: '转化率较上周下降 2.3%，建议检查销售漏斗瓶颈环节。',
    },
    {
      icon: <Zap size={18} strokeWidth={2} />,
      title: '加速成交信号',
      desc: '2 个商机出现强烈购买信号，建议立即推进报价流程。',
    },
  ];

  /* ---- Pipeline forecast ---- */
  const forecastStages = Array.isArray(pipeline)
    ? pipeline
    : [
        { stage: '初步接触', value: 120000, color: '#94A3B8' },
        { stage: '需求确认', value: 280000, color: '#1F6FEB' },
        { stage: '方案报价', value: 450000, color: '#A855F7' },
        { stage: '谈判中', value: 320000, color: '#EAB308' },
        { stage: '已成交', value: 180000, color: '#22C55E' },
      ];

  const totalForecast = forecastStages.reduce((sum, s) => sum + s.value, 0);

  /* ---- Customer avatar colour helper ---- */
  const avatarColor = (name) => {
    const colors = ['#1F6FEB', '#A855F7', '#22C55E', '#EAB308', '#EF4444', '#EC4899'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  return (
    <div style={styles.page}>
      {/* ------------------------------------------------------------ */}
      {/*  Header                                                      */}
      {/* ------------------------------------------------------------ */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>
            <LayoutDashboard size={28} strokeWidth={1.8} color={theme.primary} />
            驾驶舱
          </h1>
          <p style={styles.headerSubtitle}>今日概览</p>
        </div>
        <div style={styles.headerBadge}>
          <Package size={14} strokeWidth={2} />
          数据更新于 {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/*  Stat Cards (4-column grid)                                  */}
      {/* ------------------------------------------------------------ */}
      <section style={styles.statsGrid}>
        {statCards.map((card, idx) => (
          <div key={idx} style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={styles.statLabel}>{card.label}</p>
              <div style={{ ...styles.statIconWrap, backgroundColor: card.bg, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <p style={styles.statValue}>{card.value}</p>
            <p style={{ ...styles.statChange, color: card.color }}>{card.change}</p>
          </div>
        ))}
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Row 2: AI Actions + High-value customers                    */}
      {/* ------------------------------------------------------------ */}
      <div style={styles.twoColGrid}>
        {/* AI 推荐行动 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <Brain size={18} strokeWidth={2} color={theme.primary} />
              AI 推荐行动
            </h2>
            <button style={styles.viewAll}>
              查看全部 <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {aiActions.map((action, idx) => (
              <div key={idx} style={styles.aiCard}>
                <div style={styles.aiIconWrap}>{action.icon}</div>
                <div style={styles.aiContent}>
                  <p style={styles.aiTitle}>{action.title}</p>
                  <p style={styles.aiDesc}>{action.desc}</p>
                </div>
                <ChevronRight size={16} strokeWidth={1.8} color={theme.muted} style={{ flexShrink: 0, marginTop: '10px' }} />
              </div>
            ))}
          </div>
        </div>

        {/* 高价值客户 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <UserCheck size={18} strokeWidth={2} color="#22C55E" />
              高价值客户
            </h2>
            <button style={styles.viewAll}>
              查看全部 <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>

          {topCustomers.length === 0 ? (
            <p style={{ color: theme.muted, fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
              暂无高价值客户数据
            </p>
          ) : (
            <div>
              {topCustomers.map((customer, idx) => {
                const name = customer.name || customer.company || `客户 #${idx + 1}`;
                const initials = name
                  .split(/[\s,，]+/)
                  .slice(0, 2)
                  .map((w) => w.charAt(0))
                  .join('')
                  .toUpperCase();
                return (
                  <div
                    key={customer.id || idx}
                    style={{
                      ...styles.customerItem,
                      borderBottom: idx < topCustomers.length - 1 ? `1px solid ${theme.border}` : 'none',
                    }}
                  >
                    <div style={styles.customerInfo}>
                      <div style={{ ...styles.customerAvatar, backgroundColor: avatarColor(name) }}>
                        {initials || '?'}
                      </div>
                      <div>
                        <p style={styles.customerName}>{name}</p>
                        <p style={styles.customerMeta}>
                          {customer.industry || customer.category || '--'} · 预计 {formatMoney(customer.estimated_value || 0)}
                        </p>
                      </div>
                    </div>
                    <div style={{ ...styles.scoreBadge, backgroundColor: scoreColor(customer.score) }}>
                      {customer.score ?? '--'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Row 3: Pipeline forecast + Risk reminders                   */}
      {/* ------------------------------------------------------------ */}
      <div style={styles.twoColGrid}>
        {/* 成交预测 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <GitPullRequest size={18} strokeWidth={2} color={theme.primary} />
              成交预测
            </h2>
            <span style={{ fontSize: '14px', fontWeight: 700, color: theme.primary }}>
              {formatMoney(forecast_amount || totalForecast)}
            </span>
          </div>

          <div>
            {forecastStages.map((stage, idx) => {
              const pct = totalForecast > 0 ? (stage.value / totalForecast) * 100 : 0;
              return (
                <div key={idx}>
                  <div style={styles.forecastRow}>
                    <p style={styles.forecastLabel}>{stage.stage}</p>
                    <p style={styles.forecastValue}>{formatMoney(stage.value)}</p>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${pct}%`, backgroundColor: stage.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
            <p style={{ fontSize: '13px', color: theme.secondary, margin: 0 }}>
              进行中商机 <strong style={{ color: theme.text }}>{active_deals}</strong>
            </p>
            <p style={{ fontSize: '13px', color: theme.secondary, margin: 0 }}>
              预测总额 <strong style={{ color: theme.text }}>{formatMoney(forecast_amount || totalForecast)}</strong>
            </p>
          </div>
        </div>

        {/* 风险提醒 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <AlertTriangle size={18} strokeWidth={2} color="#EF4444" />
              风险提醒
            </h2>
            <button style={styles.viewAll}>
              查看全部 <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>

          {riskCustomers.length === 0 ? (
            <p style={{ color: theme.muted, fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
              暂无风险提醒，一切正常
            </p>
          ) : (
            <div>
              {riskCustomers.slice(0, 4).map((customer, idx) => {
                const name = customer.name || customer.company || `客户 #${idx + 1}`;
                const reason = customer.risk_reason || customer.attention_reason || '长时间未跟进，存在流失风险';
                return (
                  <div
                    key={customer.id || idx}
                    style={{
                      ...styles.riskItem,
                      borderBottom: idx < Math.min(riskCustomers.length, 4) - 1 ? `1px solid ${theme.border}` : 'none',
                    }}
                  >
                    <AlertTriangle size={16} strokeWidth={2} color="#EF4444" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: theme.text, margin: 0 }}>{name}</p>
                      <p style={styles.riskReason}>{reason}</p>
                    </div>
                    <div style={{ ...styles.scoreBadge, backgroundColor: scoreColor(customer.score) }}>
                      {customer.score ?? '--'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

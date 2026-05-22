import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  Users as UsersIcon,
  Search,
  Filter,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Brain,
} from 'lucide-react';

const statusConfig = {
  pending: {
    label: '待处理',
    icon: Clock,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
  },
  contacted: {
    label: '已联系',
    icon: MessageCircle,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
  },
  qualified: {
    label: '已认可',
    icon: CheckCircle,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
  },
  converted: {
    label: '已转化',
    icon: TrendingUp,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
  },
};

const intentConfig = {
  qualification: { label: '资质', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.12)' },
  tax: { label: '税务', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.12)' },
  subsidy: { label: '补贴', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.12)' },
  ip: { label: '知识产权', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.12)' },
};

const platformOptions = ['全部', '企业微信', '微信', '官网', '抖音', '小程序'];
const statusOptions = ['全部', ...Object.keys(statusConfig)];
const intentOptions = ['全部', ...Object.keys(intentConfig)];

const styles = {
  container: {
    padding: '32px',
    minHeight: '100vh',
    backgroundColor: '#0A0A0F',
    color: '#E2E8F0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    marginBottom: '32px',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#F1F5F9',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  headerSubtitle: {
    fontSize: '14px',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#12121A',
    borderRadius: '12px',
    padding: '20px 24px',
    border: '1px solid #1E1E2A',
    transition: 'border-color 0.2s ease',
    cursor: 'default',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748B',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#F1F5F9',
    margin: 0,
    letterSpacing: '-0.03em',
  },
  statChange: {
    fontSize: '12px',
    color: '#10B981',
    margin: '4px 0 0 0',
  },
  filtersContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 280px',
    minWidth: '200px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#475569',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    backgroundColor: '#12121A',
    border: '1px solid #1E1E2A',
    borderRadius: '8px',
    color: '#E2E8F0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  select: {
    padding: '10px 32px 10px 14px',
    backgroundColor: '#12121A',
    border: '1px solid #1E1E2A',
    borderRadius: '8px',
    color: '#E2E8F0',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    minWidth: '110px',
  },
  filterIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#12121A',
    border: '1px solid #1E1E2A',
    borderRadius: '8px',
    color: '#94A3B8',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tableWrapper: {
    backgroundColor: '#12121A',
    borderRadius: '12px',
    border: '1px solid #1E1E2A',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #1E1E2A',
    backgroundColor: '#0E0E16',
  },
  td: {
    padding: '16px 20px',
    fontSize: '14px',
    borderBottom: '1px solid #1A1A26',
    color: '#E2E8F0',
    verticalAlign: 'middle',
  },
  leadRow: {
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#1E1E2A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    color: '#94A3B8',
    flexShrink: 0,
  },
  userName: {
    fontWeight: 500,
    color: '#F1F5F9',
  },
  userPlatform: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  intentTag: (config) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    color: config.color,
    backgroundColor: config.bgColor,
  }),
  statusBadge: (config) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    color: config.color,
    backgroundColor: config.bgColor,
  }),
  progressBarBg: {
    width: '120px',
    height: '6px',
    backgroundColor: '#1E1E2A',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: (score) => ({
    width: `${score}%`,
    height: '100%',
    borderRadius: '4px',
    background: score >= 80
      ? 'linear-gradient(90deg, #10B981, #34D399)'
      : score >= 50
        ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
        : 'linear-gradient(90deg, #EF4444, #F87171)',
    transition: 'width 0.4s ease',
  }),
  scoreText: (score) => ({
    fontSize: '13px',
    fontWeight: 600,
    color: score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
    marginBottom: '4px',
  }),
  actions: {
    display: 'flex',
    gap: '6px',
  },
  actionBtn: (variant) => ({
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #1E1E2A',
    cursor: 'pointer',
    transition: 'all 0.15s',
    backgroundColor: variant === 'primary' ? '#3B82F6' : 'transparent',
    color: variant === 'primary' ? '#FFFFFF' : '#94A3B8',
    borderColor: variant === 'primary' ? '#3B82F6' : '#1E1E2A',
  }),
  expandedRow: {
    backgroundColor: '#0E0E16',
  },
  expandedContent: {
    padding: '24px 20px 24px 76px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  analysisCard: {
    backgroundColor: '#12121A',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #1E1E2A',
  },
  analysisTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  analysisRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #1A1A26',
  },
  analysisLabel: {
    fontSize: '13px',
    color: '#64748B',
  },
  analysisValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#E2E8F0',
  },
  suggestionItem: {
    padding: '8px 12px',
    margin: '6px 0',
    backgroundColor: '#1A1A26',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#94A3B8',
  },
  messageCell: {
    maxWidth: '260px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#94A3B8',
    fontSize: '13px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748B',
  },
};

const initialLeads = [
  {
    id: 1,
    name: '张伟',
    platform: '企业微信',
    message: '您好，我想咨询一下公司申请高新技术企业认定的具体条件和流程，我们公司是做人工智能的，成立两年了。',
    intent: 'qualification',
    score: 92,
    status: 'pending',
    aiAnalysis: {
      intentMatch: 94,
      suggestedProducts: ['高新技术企业认定', '研发费用加计扣除', '知识产权布局'],
      keywords: ['高新认定', '人工智能', '成立两年'],
      priority: '高优先级 — 符合高新认定基本条件，意向明确',
    },
  },
  {
    id: 2,
    name: '李芳',
    platform: '微信',
    message: '最近税务政策有什么变化吗？我们中小企业能享受哪些税收优惠？',
    intent: 'tax',
    score: 78,
    status: 'qualified',
    aiAnalysis: {
      intentMatch: 82,
      suggestedProducts: ['税务筹划咨询', '小微企业税收优惠', '增值税减免申请'],
      keywords: ['税务政策', '中小企业', '税收优惠'],
      priority: '中高优先级 — 有明确税务需求，可转化为咨询客户',
    },
  },
  {
    id: 3,
    name: '王强',
    platform: '官网',
    message: '请问政府对于科技创新企业有什么补贴政策？我们正在做芯片研发。',
    intent: 'subsidy',
    score: 88,
    status: 'contacted',
    aiAnalysis: {
      intentMatch: 90,
      suggestedProducts: ['科技型中小企业补贴', '芯片产业专项补贴', '研发资助申请'],
      keywords: ['科技创新', '补贴政策', '芯片研发'],
      priority: '高优先级 — 芯片产业有专项补贴政策，需求匹配度高',
    },
  },
  {
    id: 4,
    name: '赵雪',
    platform: '抖音',
    message: '我们公司的商标被抢注了，该怎么办？需要做知识产权保护。',
    intent: 'ip',
    score: 85,
    status: 'pending',
    aiAnalysis: {
      intentMatch: 88,
      suggestedProducts: ['商标注册与维权', '知识产权保护方案', '商标监测服务'],
      keywords: ['商标抢注', '知识产权保护'],
      priority: '高优先级 — 紧急商标维权需求，需尽快响应',
    },
  },
  {
    id: 5,
    name: '陈明',
    platform: '小程序',
    message: '想了解一下高新企业复审的流程，我们公司明年需要复审了。',
    intent: 'qualification',
    score: 65,
    status: 'converted',
    aiAnalysis: {
      intentMatch: 72,
      suggestedProducts: ['高新企业复审服务', '知识产权维护'],
      keywords: ['高新复审', '流程咨询'],
      priority: '中优先级 — 远期需求，可培育跟进',
    },
  },
  {
    id: 6,
    name: '刘洋',
    platform: '企业微信',
    message: '个人所得税汇算清缴怎么操作？公司员工都想了解。',
    intent: 'tax',
    score: 45,
    status: 'pending',
    aiAnalysis: {
      intentMatch: 52,
      suggestedProducts: ['个税汇算清缴咨询', '企业财税培训'],
      keywords: ['个人所得税', '汇算清缴'],
      priority: '低优先级 — 通用咨询，需进一步挖掘需求',
    },
  },
  {
    id: 7,
    name: '孙莉',
    platform: '微信',
    message: '我们想申请一些政府补贴来支持公司的数字化转型项目。',
    intent: 'subsidy',
    score: 73,
    status: 'contacted',
    aiAnalysis: {
      intentMatch: 76,
      suggestedProducts: ['数字化转型补贴', '两化融合贯标', '专项资金申请'],
      keywords: ['政府补贴', '数字化转型'],
      priority: '中高优先级 — 数字化转型补贴方向明确，有政策支持',
    },
  },
  {
    id: 8,
    name: '周杰',
    platform: '官网',
    message: '公司准备上市，需要系统性地做知识产权布局和专利储备。',
    intent: 'ip',
    score: 95,
    status: 'pending',
    aiAnalysis: {
      intentMatch: 97,
      suggestedProducts: ['IPO知识产权顾问', '专利挖掘与布局', '知识产权尽调', '专利导航'],
      keywords: ['上市', '知识产权布局', '专利储备'],
      priority: '极高优先级 — 上市前知识产权布局刚需，客单价高',
    },
  },
];

export default function Leads() {
  const store = useStore?.();
  const leadsData = store?.leads ?? initialLeads;

  const [expandedId, setExpandedId] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [leadAnalysis, setLeadAnalysis] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [platformFilter, setPlatformFilter] = useState('全部');
  const [intentFilter, setIntentFilter] = useState('全部');

  const filteredLeads = useMemo(() => {
    return leadsData.filter((lead) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !lead.name.toLowerCase().includes(q) &&
          !lead.message.toLowerCase().includes(q) &&
          !lead.platform.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (statusFilter !== '全部' && lead.status !== statusFilter) return false;
      if (platformFilter !== '全部' && lead.platform !== platformFilter) return false;
      if (intentFilter !== '全部' && lead.intent !== intentFilter) return false;
      return true;
    });
  }, [leadsData, searchQuery, statusFilter, platformFilter, intentFilter]);

  const stats = useMemo(() => {
    const total = leadsData.length;
    const highIntent = leadsData.filter((l) => l.score >= 80).length;
    const pending = leadsData.filter((l) => l.status === 'pending').length;
    const converted = leadsData.filter((l) => l.status === 'converted').length;
    return { total, highIntent, pending, converted };
  }, [leadsData]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAnalyzeLead = async (e, lead) => {
    e.stopPropagation();
    setAnalyzingId(lead.id);
    try {
      const res = await (store?.analyzeLead || (() => {}))({ leadId: lead.id, message: lead.message, platform: lead.platform });
      if (res) setLeadAnalysis(prev => ({ ...prev, [lead.id]: res }));
    } catch {
      // Fallback: local analysis based on message
      const intentPatterns = [
        { intent: 'qualification', keywords: ['认定', '申报', '资质', '专精特新', '高新', '项目申报'] },
        { intent: 'tax', keywords: ['税务', '税收', '筹划', '税', '发票', '报税'] },
        { intent: 'subsidy', keywords: ['补贴', '政府', '扶持', '资金', '补助', '奖励'] },
        { intent: 'ip', keywords: ['商标', '专利', '知识产权', '版权', '注册', '申请'] },
      ];
      let detectedIntent = 'general', maxScore = 0;
      for (const p of intentPatterns) {
        let hits = 0;
        for (const kw of p.keywords) if ((lead.message || '').includes(kw)) hits++;
        if (hits > maxScore) { maxScore = hits; detectedIntent = p.intent; }
      }
      const urgencyWords = ['急', '快', '马上', '立即', '加急', '尽快', '紧急'];
      const hasUrgency = urgencyWords.some(w => (lead.message || '').includes(w));
      const hasCompany = (lead.message || '').includes('公司') || (lead.message || '').includes('企业');
      let score = 50;
      if (detectedIntent !== 'general') score += 20;
      if (hasUrgency) score += 15;
      if (hasCompany) score += 10;
      if ((lead.message || '').length > 30) score += 5;
      setLeadAnalysis(prev => ({ ...prev, [lead.id]: {
        intent: detectedIntent, intentLabel: detectedIntent, score: Math.min(score, 100),
        keywords: intentPatterns.find(p => p.intent === detectedIntent)?.keywords || [],
        suggestedReply: '感谢您的留言！我们提供一站式企业服务解决方案。方便告诉我更多需求细节吗？',
        intentMatch: Math.min(score, 100), priority: score >= 80 ? '高' : score >= 50 ? '中' : '低',
        suggestedProducts: detectedIntent === 'qualification' ? ['高新认定服务', '专精特新申报'] : detectedIntent === 'tax' ? ['税务筹划方案'] : detectedIntent === 'subsidy' ? ['政府补贴申请'] : detectedIntent === 'ip' ? ['知识产权代理'] : [],
      }}));
    }
    setAnalyzingId(null);
  };

  const updateStatus = (e, leadId, newStatus) => {
    e.stopPropagation();
    if (!store?.updateLeadStatus) return;
    store.updateLeadStatus(leadId, newStatus);
  };

  const getStatusActions = (lead) => {
    const nextStatuses = [];
    if (lead.status === 'pending') {
      nextStatuses.push({ key: 'contacted', label: '联系' });
      nextStatuses.push({ key: 'qualified', label: '认可' });
    } else if (lead.status === 'contacted') {
      nextStatuses.push({ key: 'qualified', label: '认可' });
      nextStatuses.push({ key: 'pending', label: '回退' });
    } else if (lead.status === 'qualified') {
      nextStatuses.push({ key: 'converted', label: '转化' });
      nextStatuses.push({ key: 'contacted', label: '回退' });
    } else if (lead.status === 'converted') {
      nextStatuses.push({ key: 'qualified', label: '回退' });
    }
    return nextStatuses;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>线索中心</h1>
        <p style={styles.headerSubtitle}>
          <Brain size={16} />
          AI意图识别与评分
        </p>
      </div>

      {/* Stats Overview */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            <UsersIcon size={16} /> 总线索数
          </p>
          <p style={styles.statValue}>{stats.total}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            <TrendingUp size={16} color="#10B981" /> 高意向
          </p>
          <p style={styles.statValue}>{stats.highIntent}</p>
          <p style={styles.statChange}>
            评分 80 分以上
          </p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            <Clock size={16} color="#F59E0B" /> 待处理
          </p>
          <p style={styles.statValue}>{stats.pending}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            <CheckCircle size={16} color="#10B981" /> 已转化
          </p>
          <p style={styles.statValue}>{stats.converted}</p>
          <p style={styles.statChange}>
            转化率 {stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>
            <Search size={16} />
          </span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="搜索线索名称、消息、平台..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#1E1E2A';
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="#64748B" />
        </div>

        <select
          style={styles.select}
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
        >
          {platformOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === '全部' ? '全部平台' : opt}
            </option>
          ))}
        </select>

        <select
          style={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === '全部' ? '全部状态' : statusConfig[opt]?.label ?? opt}
            </option>
          ))}
        </select>

        <select
          style={styles.select}
          value={intentFilter}
          onChange={(e) => setIntentFilter(e.target.value)}
        >
          {intentOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === '全部' ? '全部意图' : intentConfig[opt]?.label ?? opt}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>用户</th>
              <th style={styles.th}>平台</th>
              <th style={styles.th}>消息</th>
              <th style={styles.th}>意图标签</th>
              <th style={styles.th}>评分</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center' }}>
                  <div style={styles.emptyState}>
                    <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>没有匹配的线索</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                      尝试调整筛选条件或搜索关键词
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const StatusIcon = statusConfig[lead.status].icon;
                const isExpanded = expandedId === lead.id;

                return (
                  <React.Fragment key={lead.id}>
                    <tr
                      style={{
                        ...styles.leadRow,
                        backgroundColor: isExpanded ? '#0E0E16' : 'transparent',
                      }}
                      onClick={() => toggleExpand(lead.id)}
                    >
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={styles.avatar}>
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div style={styles.userName}>{lead.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                          {lead.platform}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.messageCell} title={lead.message}>
                          {lead.message}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.intentTag(intentConfig[lead.intent])}>
                          {intentConfig[lead.intent].label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.scoreText(lead.score)}>{lead.score}%</div>
                        <div style={styles.progressBarBg}>
                          <div style={styles.progressBarFill(lead.score)} />
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(statusConfig[lead.status])}>
                          <StatusIcon size={12} />
                          {statusConfig[lead.status].label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {getStatusActions(lead).map((action) => (
                            <button
                              key={action.key}
                              style={{
                                ...styles.actionBtn(action.key === 'pending' ? 'secondary' : 'primary'),
                              }}
                              onClick={(e) => updateStatus(e, lead.id, action.key)}
                              onMouseEnter={(e) => {
                                if (action.key !== 'pending') {
                                  e.target.style.opacity = '0.85';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.opacity = '1';
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail */}
                    {isExpanded && (() => {
                      const analysis = leadAnalysis[lead.id] || lead.aiAnalysis;
                      const keywords = analysis?.keywords || [];
                      const suggestedProducts = analysis?.suggestedProducts || [];
                      const intentMatch = analysis?.intentMatch != null ? analysis.intentMatch : (analysis?.score || lead.score || 0);
                      const priority = analysis?.priority || (intentMatch >= 80 ? '高' : intentMatch >= 50 ? '中' : '低');
                      const suggestedReply = analysis?.suggestedReply || '';

                      return (
                      <tr style={styles.expandedRow}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={styles.expandedContent}>
                            {/* AI Analysis Card */}
                            <div style={styles.analysisCard}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h4 style={styles.analysisTitle}>
                                  <Brain size={15} color="#8B5CF6" />
                                  AI 意图分析
                                </h4>
                                <button
                                  onClick={(e) => handleAnalyzeLead(e, lead)}
                                  disabled={analyzingId === lead.id}
                                  style={{
                                    background: '#1F6FEB',
                                    color: '#FFF',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Brain size={12} />
                                  {analyzingId === lead.id ? '分析中...' : 'AI 分析'}
                                </button>
                              </div>
                              <div style={styles.analysisRow}>
                                <span style={styles.analysisLabel}>意图匹配度</span>
                                <span style={{ ...styles.analysisValue, color: intentMatch >= 80 ? '#10B981' : '#F59E0B' }}>
                                  {intentMatch}%
                                </span>
                              </div>
                              <div style={styles.analysisRow}>
                                <span style={styles.analysisLabel}>AI 优先级评定</span>
                                <span style={{ ...styles.analysisValue, fontSize: '12px' }}>
                                  {priority}
                                </span>
                              </div>
                              <div style={styles.analysisRow}>
                                <span style={styles.analysisLabel}>关键匹配词</span>
                                <span style={styles.analysisValue}>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {keywords.map((kw, i) => (
                                      <span
                                        key={i}
                                        style={{
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          backgroundColor: 'rgba(139, 92, 246, 0.12)',
                                          color: '#A78BFA',
                                        }}
                                      >
                                        {kw}
                                      </span>
                                    ))}
                                    {keywords.length === 0 && <span style={{ fontSize: '12px', color: '#64748B' }}>点击"AI分析"获取</span>}
                                  </div>
                                </span>
                              </div>
                              {suggestedReply && (
                                <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                                  <div style={{ fontSize: '12px', color: '#60A5FA', fontWeight: 500, marginBottom: '4px' }}>建议回复</div>
                                  <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.5 }}>{suggestedReply}</div>
                                </div>
                              )}
                            </div>

                            {/* Suggested Products Card */}
                            {suggestedProducts.length > 0 && (
                            <div style={styles.analysisCard}>
                              <h4 style={styles.analysisTitle}>
                                <TrendingUp size={15} color="#10B981" />
                                推荐产品 / 服务
                              </h4>
                              {suggestedProducts.map((product, i) => (
                                <div key={i} style={styles.suggestionItem}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                      color: '#10B981',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      marginRight: '10px',
                                    }}
                                  >
                                    {i + 1}
                                  </span>
                                  {typeof product === 'string' ? product : (product.productName || product.name || '')}
                                </div>
                              ))}
                            </div>
                            )}

                            <div style={styles.analysisCard}>
                              <div
                                style={{
                                  padding: '12px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                  border: '1px solid rgba(59, 130, 246, 0.15)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: '#60A5FA',
                                    fontWeight: 500,
                                    marginBottom: '4px',
                                  }}
                                >
                                  AI 建议
                                </div>
                                <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5 }}>
                                  该线索意向明确，建议优先跟进。
                                  {(lead.score || 0) >= 80
                                    ? ' 高评分线索，推荐立即联系并推送相关产品资料。'
                                    : (lead.score || 0) >= 50
                                      ? ' 中等评分线索，建议进一步沟通挖掘具体需求。'
                                      : ' 低评分线索，可先通过标准化内容培育。'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      );
                    })()}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

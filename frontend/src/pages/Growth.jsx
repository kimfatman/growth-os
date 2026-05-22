import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  TrendingUp,
  Globe,
  Send,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

const theme = {
  bg: '#0B0F1A',
  card: '#121826',
  border: '#1E293B',
  primary: '#1F6FEB',
  text: '#E2E8F0',
  secondary: '#94A3B8',
  muted: '#64748B',
};

const platforms = [
  { id: 'xiaohongshu', name: '小红书', connected: true },
  { id: 'douyin', name: '抖音', connected: true },
  { id: 'shipinhao', name: '视频号', connected: false },
  { id: 'kuaishou', name: '快手', connected: true },
  { id: 'bilibili', name: 'B站', connected: true },
  { id: 'gongzhonghao', name: '公众号', connected: false },
];

const sampleContent = [
  {
    id: 1,
    title: 'AI在2026年的3大趋势',
    platform: '小红书',
    status: 'published',
    time: '2026-05-06 09:30',
  },
  {
    id: 2,
    title: '如何用AI提升10倍效率',
    platform: '抖音',
    status: 'scheduled',
    time: '2026-05-07 12:00',
  },
  {
    id: 3,
    title: '创业者的AI工具箱',
    platform: 'B站',
    status: 'draft',
    time: '2026-05-05 18:00',
  },
  {
    id: 4,
    title: '2026年增长黑客实战',
    platform: '快手',
    status: 'failed',
    time: '2026-05-04 14:20',
  },
  {
    id: 5,
    title: '小红书爆款内容策略',
    platform: '小红书',
    status: 'published',
    time: '2026-05-03 10:00',
  },
  {
    id: 6,
    title: '视频号运营入门指南',
    platform: '视频号',
    status: 'scheduled',
    time: '2026-05-08 08:00',
  },
];

const statusConfig = {
  published: { icon: CheckCircle, color: '#22C55E', label: '已发布' },
  scheduled: { icon: Clock, color: '#F59E0B', label: '已排期' },
  draft: { icon: Clock, color: theme.muted, label: '草稿' },
  failed: { icon: XCircle, color: '#EF4444', label: '失败' },
};

export default function Growth() {
  const store = useStore();
  const [topic, setTopic] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('xiaohongshu');
  const [generatedContent, setGeneratedContent] = useState('');

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGeneratedContent(
      `【${platforms.find((p) => p.id === selectedPlatform)?.name}】\n\n` +
        `标题：${topic.trim()}\n\n` +
        `正文：\n` +
        `你是否知道${topic.trim()}正在悄然改变我们的生活方式？\n\n` +
        `在过去的一年里，这个领域的增长超过了300%，越来越多的创业者开始关注这一赛道。\n\n` +
        `今天我们就来深入分析一下${topic.trim()}背后的核心逻辑，以及普通人如何抓住这波红利。\n\n` +
        `#增长 #AI #创业 #${topic.trim()}`
    );
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: theme.bg,
    color: theme.text,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  };

  const headerStyle = {
    padding: '32px 40px 24px',
    borderBottom: `1px solid ${theme.border}`,
  };

  const headerTitleStyle = {
    fontSize: '28px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: 0,
  };

  const headerSubtitleStyle = {
    fontSize: '14px',
    color: theme.secondary,
    marginTop: '6px',
    marginLeft: '40px',
  };

  const mainStyle = {
    padding: '32px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const sectionStyle = {
    marginBottom: '40px',
  };

  const sectionHeaderStyle = {
    fontSize: '20px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
  };

  const cardStyle = {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'border-color 0.2s, transform 0.2s',
    cursor: 'pointer',
  };

  const platformNameStyle = {
    fontSize: '16px',
    fontWeight: 600,
  };

  const badgeContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
  };

  const generateBtnStyle = {
    backgroundColor: theme.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'opacity 0.2s',
  };

  const generateSectionStyle = {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '24px',
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '100px',
    backgroundColor: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    padding: '14px',
    fontSize: '14px',
    lineHeight: '1.6',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const inputRowStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '14px',
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const selectStyle = {
    backgroundColor: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    minWidth: '160px',
    cursor: 'pointer',
  };

  const primaryBtnStyle = {
    backgroundColor: theme.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 28px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'opacity 0.2s',
  };

  const outputStyle = {
    backgroundColor: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
    whiteSpace: 'pre-wrap',
    fontSize: '14px',
    lineHeight: '1.7',
    color: theme.secondary,
    minHeight: generatedContent ? 'auto' : '80px',
    display: 'flex',
    alignItems: generatedContent ? 'flex-start' : 'center',
    justifyContent: generatedContent ? 'flex-start' : 'center',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    overflow: 'hidden',
  };

  const thStyle = {
    textAlign: 'left',
    padding: '14px 18px',
    fontSize: '13px',
    fontWeight: 600,
    color: theme.secondary,
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.bg,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tdStyle = {
    padding: '14px 18px',
    fontSize: '14px',
    borderBottom: `1px solid ${theme.border}`,
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={headerTitleStyle}>
          <TrendingUp size={28} color={theme.primary} />
          增长中心
        </h1>
        <p style={headerSubtitleStyle}>多平台内容增长</p>
      </div>

      {/* Main Content */}
      <div style={mainStyle}>
        {/* Platform Cards Section */}
        <div style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>
            <Globe size={22} color={theme.primary} />
            平台管理
          </h2>
          <div style={gridStyle}>
            {platforms.map((platform) => {
              const StatusIcon = platform.connected ? CheckCircle : XCircle;
              return (
                <div
                  key={platform.id}
                  style={{
                    ...cardStyle,
                    ':hover': {
                      borderColor: theme.primary,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.primary;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: platform.connected
                          ? 'rgba(31, 111, 235, 0.15)'
                          : 'rgba(100, 116, 139, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: platform.connected ? theme.primary : theme.muted,
                      }}
                    >
                      {platform.name.charAt(0)}
                    </div>
                    <span style={platformNameStyle}>{platform.name}</span>
                  </div>
                  <div style={badgeContainerStyle}>
                    <StatusIcon
                      size={14}
                      color={platform.connected ? '#22C55E' : '#EF4444'}
                    />
                    <span
                      style={{
                        color: platform.connected ? '#22C55E' : '#EF4444',
                      }}
                    >
                      {platform.connected ? '已连接' : '未连接'}
                    </span>
                  </div>
                  <button
                    style={generateBtnStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.85';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onClick={() => {
                      setSelectedPlatform(platform.id);
                      document
                        .getElementById('content-generate-section')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    生成内容
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Generation Section */}
        <div style={sectionStyle} id="content-generate-section">
          <h2 style={sectionHeaderStyle}>
            <BarChart3 size={22} color={theme.primary} />
            内容生成
          </h2>
          <div style={generateSectionStyle}>
            <textarea
              style={textareaStyle}
              placeholder="输入内容主题或关键词，例如：AI趋势、增长策略、创业心得..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div style={inputRowStyle}>
              <select
                style={selectStyle}
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
              >
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                style={primaryBtnStyle}
                onClick={handleGenerate}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <Send size={16} />
                生成
              </button>
            </div>
            <div style={outputStyle}>
              {generatedContent || (
                <span style={{ color: theme.muted }}>
                  输入主题并点击「生成」按钮，AI将自动生成多平台适配内容
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Publish Management Section */}
        <div style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>
            <Send size={22} color={theme.primary} />
            发布管理
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>内容标题</th>
                  <th style={thStyle}>平台</th>
                  <th style={thStyle}>状态</th>
                  <th style={thStyle}>时间</th>
                  <th style={thStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {sampleContent.map((item) => {
                  const StatusIcon = statusConfig[item.status].icon;
                  const statusColor = statusConfig[item.status].color;
                  const statusLabel = statusConfig[item.status].label;

                  return (
                    <tr key={item.id}>
                      <td style={tdStyle}>{item.title}</td>
                      <td style={tdStyle}>
                        <span style={{ color: theme.secondary }}>{item.platform}</span>
                      </td>
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <StatusIcon size={15} color={statusColor} />
                          <span style={{ color: statusColor }}>{statusLabel}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: theme.muted, fontSize: '13px' }}>
                          {item.time}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          style={{
                            backgroundColor: 'transparent',
                            border: `1px solid ${theme.border}`,
                            borderRadius: '6px',
                            color: theme.secondary,
                            padding: '5px 12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = theme.primary;
                            e.currentTarget.style.color = theme.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = theme.border;
                            e.currentTarget.style.color = theme.secondary;
                          }}
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

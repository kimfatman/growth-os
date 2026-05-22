import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Library,
  Search,
  Tag,
  Clock,
  Eye,
  Heart,
  Share2,
  FileText,
  Video,
  File,
} from 'lucide-react';

const THEME = {
  bg: '#0B0F1A',
  card: '#121826',
  border: '#1E293B',
  primary: '#1F6FEB',
  text: '#E2E8F0',
  secondary: '#94A3B8',
  muted: '#64748B',
};

const PLATFORM_LABELS = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  wechat_article: '公众号',
  wechat_video: '视频号',
  bilibili: 'B站',
};

const TYPE_LABELS = {
  article: '图文',
  video_script: '视频脚本',
  video: '视频',
};

const TYPE_ICONS = {
  article: FileText,
  video_script: Video,
  video: Video,
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function formatNumber(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function ContentPage() {
  const content = useStore((s) => s.content);
  const loadContent = useStore((s) => s.loadContent);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const platforms = [...new Set(content.map((c) => c.platform))];
  const types = [...new Set(content.map((c) => c.type))];

  const filtered = content.filter((item) => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedPlatform && item.platform !== selectedPlatform) {
      return false;
    }
    if (selectedType && item.type !== selectedType) {
      return false;
    }
    return true;
  });

  function toggleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  function renderStatusBadge(status) {
    const isPublished = status === 'published';
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 500,
          background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
          color: isPublished ? '#22c55e' : '#eab308',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isPublished ? '#22c55e' : '#eab308',
          }}
        />
        {isPublished ? '已发布' : '草稿'}
      </span>
    );
  }

  function renderTypeIcon(type) {
    const Icon = TYPE_ICONS[type] || File;
    return <Icon size={14} />;
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: THEME.bg,
        padding: '20px 16px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4,
          }}
        >
          <Library size={22} color={THEME.primary} />
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: THEME.text,
              margin: 0,
            }}
          >
            内容库
          </h1>
        </div>
        <p
          style={{
            fontSize: 13,
            color: THEME.muted,
            margin: 0,
            marginLeft: 32,
          }}
        >
          内容管理与复用
        </p>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: '0 14px',
          height: 42,
          marginBottom: 16,
        }}
      >
        <Search size={16} color={THEME.muted} />
        <input
          type="text"
          placeholder="搜索内容标题..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: THEME.text,
            fontSize: 14,
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.muted,
              cursor: 'pointer',
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div style={{ marginBottom: 16 }}>
        {/* Platform filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: THEME.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginRight: 4,
            }}
          >
            <Tag size={12} />
            平台:
          </span>
          <Chip
            label="全部"
            active={selectedPlatform === null}
            onClick={() => setSelectedPlatform(null)}
            theme={THEME}
          />
          {platforms.map((p) => (
            <Chip
              key={p}
              label={PLATFORM_LABELS[p] || p}
              active={selectedPlatform === p}
              onClick={() =>
                setSelectedPlatform(selectedPlatform === p ? null : p)
              }
              theme={THEME}
            />
          ))}
        </div>

        {/* Type filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: THEME.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginRight: 4,
            }}
          >
            <FileText size={12} />
            类型:
          </span>
          <Chip
            label="全部"
            active={selectedType === null}
            onClick={() => setSelectedType(null)}
            theme={THEME}
          />
          {types.map((t) => (
            <Chip
              key={t}
              label={TYPE_LABELS[t] || t}
              active={selectedType === t}
              onClick={() =>
                setSelectedType(selectedType === t ? null : t)
              }
              theme={THEME}
            />
          ))}
        </div>
      </div>

      {/* Content count */}
      <div
        style={{
          fontSize: 12,
          color: THEME.muted,
          marginBottom: 12,
        }}
      >
        共 {filtered.length} 条内容
      </div>

      {/* Content Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: THEME.muted,
          }}
        >
          <File size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14, margin: 0 }}>
            {searchQuery || selectedPlatform || selectedType
              ? '没有匹配的内容'
              : '暂无内容'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 12,
          }}
        >
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const TypeIcon = TYPE_ICONS[item.type] || File;
            return (
              <div
                key={item.id}
                style={{
                  background: THEME.card,
                  border: `1px solid ${
                    isExpanded ? THEME.primary : THEME.border
                  }`,
                  borderRadius: 14,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onClick={() => toggleExpand(item.id)}
              >
                {/* Card Header - title + status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <TypeIcon size={16} color={THEME.primary} />
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: THEME.text,
                          margin: 0,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  {renderStatusBadge(item.status)}
                </div>

                {/* Tags row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}
                >
                  {/* Platform tag */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 500,
                      background: 'rgba(31,111,235,0.12)',
                      color: THEME.primary,
                    }}
                  >
                    {PLATFORM_LABELS[item.platform] || item.platform}
                  </span>

                  {/* Type tag */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 500,
                      background: 'rgba(148,163,184,0.12)',
                      color: THEME.secondary,
                    }}
                  >
                    {TYPE_LABELS[item.type] || item.type}
                  </span>

                  {/* Extra tags */}
                  {item.tags &&
                    item.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 400,
                          background: 'rgba(100,116,139,0.1)',
                          color: THEME.muted,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 12,
                    color: THEME.secondary,
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Eye size={13} />
                    {formatNumber(item.stats?.views ?? 0)}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Heart size={13} />
                    {formatNumber(item.stats?.likes ?? 0)}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Share2 size={13} />
                    {formatNumber(item.stats?.shares ?? 0)}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 'auto',
                    }}
                  >
                    <Clock size={13} />
                    {formatDate(item.created_at)}
                  </span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: `1px solid ${THEME.border}`,
                      fontSize: 13,
                      color: THEME.secondary,
                      lineHeight: 1.6,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                      }}
                    >
                      <div>
                        <span style={{ color: THEME.muted, fontSize: 12 }}>
                          内容ID
                        </span>
                        <div style={{ color: THEME.text, marginTop: 2 }}>
                          #{item.id}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: THEME.muted, fontSize: 12 }}>
                          创建时间
                        </span>
                        <div style={{ color: THEME.text, marginTop: 2 }}>
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: THEME.muted, fontSize: 12 }}>
                          平台
                        </span>
                        <div style={{ color: THEME.text, marginTop: 2 }}>
                          {PLATFORM_LABELS[item.platform] || item.platform}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: THEME.muted, fontSize: 12 }}>
                          类型
                        </span>
                        <div style={{ color: THEME.text, marginTop: 2 }}>
                          {TYPE_LABELS[item.type] || item.type}
                        </div>
                      </div>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <span style={{ color: THEME.muted, fontSize: 12 }}>
                          标签
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            flexWrap: 'wrap',
                            marginTop: 4,
                          }}
                        >
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                background: 'rgba(100,116,139,0.1)',
                                color: THEME.muted,
                              }}
                            >
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: `1px solid ${THEME.border}`,
                        fontSize: 12,
                        color: THEME.secondary,
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Eye size={13} />
                        浏览量 {formatNumber(item.stats?.views ?? 0)}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Heart size={13} />
                        点赞 {formatNumber(item.stats?.likes ?? 0)}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Share2 size={13} />
                        分享 {formatNumber(item.stats?.shares ?? 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ label, active, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        border: `1px solid ${active ? theme.primary : theme.border}`,
        background: active ? theme.primary : 'transparent',
        color: active ? '#ffffff' : theme.secondary,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

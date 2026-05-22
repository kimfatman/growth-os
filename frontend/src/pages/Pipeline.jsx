import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  GitPullRequest,
  DollarSign,
  Users,
  ArrowRight,
  CheckCircle,
  Target,
  Clock,
} from 'lucide-react';

const DARK_BG = '#0f0f13';
const DARK_CARD = '#1a1a24';
const DARK_CARD_HOVER = '#22222f';
const DARK_BORDER = '#2a2a3a';
const ACCENT_BLUE = '#4f8cff';
const ACCENT_GREEN = '#34d399';
const ACCENT_AMBER = '#fbbf24';
const ACCENT_PURPLE = '#a78bfa';
const ACCENT_RED = '#f87171';
const TEXT_PRIMARY = '#f1f1f6';
const TEXT_SECONDARY = '#8888a0';
const TEXT_MUTED = '#555570';

const STAGES = [
  { key: 'lead', label: '线索', color: ACCENT_BLUE },
  { key: 'interested', label: '意向', color: ACCENT_PURPLE },
  { key: 'quoted', label: '报价', color: ACCENT_AMBER },
  { key: 'negotiating', label: '谈判', color: ACCENT_RED },
  { key: 'closed', label: '成交', color: ACCENT_GREEN },
];

const DEFAULT_DEALS = [
  { id: 1, customer: '云帆科技', amount: 580000, probability: 20, stage: 'lead', expectedDate: '2026-06-15', notes: '初步接触，需求匹配度较高' },
  { id: 2, customer: '智远数据', amount: 320000, probability: 35, stage: 'lead', expectedDate: '2026-06-20', notes: '竞品对比阶段' },
  { id: 3, customer: '蓝鲸网络', amount: 720000, probability: 50, stage: 'interested', expectedDate: '2026-07-01', notes: '已完成产品演示，客户反馈积极' },
  { id: 4, customer: '天穹信息', amount: 260000, probability: 45, stage: 'interested', expectedDate: '2026-06-28', notes: '技术方案确认中' },
  { id: 5, customer: '星辰科技', amount: 950000, probability: 30, stage: 'interested', expectedDate: '2026-07-10', notes: '需安排高层会面' },
  { id: 6, customer: '锐思软件', amount: 430000, probability: 65, stage: 'quoted', expectedDate: '2026-06-10', notes: '报价已发送，等待反馈' },
  { id: 7, customer: '鸿图集团', amount: 1200000, probability: 60, stage: 'quoted', expectedDate: '2026-06-25', notes: '框架协议谈判中' },
  { id: 8, customer: '维创科技', amount: 180000, probability: 75, stage: 'quoted', expectedDate: '2026-06-05', notes: '小型试点项目' },
  { id: 9, customer: '中诚信息', amount: 680000, probability: 70, stage: 'negotiating', expectedDate: '2026-06-30', notes: '商务条款基本达成一致' },
  { id: 10, customer: '明道咨询', amount: 350000, probability: 80, stage: 'negotiating', expectedDate: '2026-06-12', notes: '合同细节审核中' },
  { id: 11, customer: '华信科技', amount: 1500000, probability: 90, stage: 'negotiating', expectedDate: '2026-06-08', notes: '接近签约，法务审核中' },
  { id: 12, customer: '鼎新软件', amount: 520000, probability: 100, stage: 'closed', expectedDate: '2026-05-30', notes: '合同已签署' },
  { id: 13, customer: '和光信息', amount: 780000, probability: 100, stage: 'closed', expectedDate: '2026-05-28', notes: '已签约，实施排期中' },
];

const formatMoney = (value) => {
  if (value >= 10000) {
    const wan = value / 10000;
    if (wan >= 10000) {
      return `¥${(wan / 10000).toFixed(1)}亿`;
    }
    return `¥${wan.toFixed(wan % 1 === 0 ? 0 : 1)}万`;
  }
  return `¥${value.toLocaleString()}`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const getDaysUntil = (dateStr) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

const stageKeyToIndex = (key) => STAGES.findIndex((s) => s.key === key);
const stageIndexToKey = (idx) => (idx >= 0 && idx < STAGES.length ? STAGES[idx].key : null);

const Pipeline = () => {
  const store = useStore?.() || {};
  const rawDeals = store.pipeline?.deals || store.deals || DEFAULT_DEALS;

  const [deals, setDeals] = useState(rawDeals);
  const [selectedDealId, setSelectedDealId] = useState(null);

  const advanceDeal = (dealId) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        const currentIdx = stageKeyToIndex(d.stage);
        if (currentIdx >= STAGES.length - 1) return d;
        const nextStage = stageIndexToKey(currentIdx + 1);
        return { ...d, stage: nextStage, probability: Math.min(d.probability + 15, 100) };
      })
    );
  };

  const stageData = STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage.key);
    const count = stageDeals.length;
    const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);
    return { ...stage, deals: stageDeals, count, totalAmount };
  });

  const pipelineTotal = deals.reduce((sum, d) => sum + d.amount, 0);
  const forecastTotal = deals.reduce((sum, d) => sum + d.amount * (d.probability / 100), 0);
  const activeDeals = deals.filter((d) => d.stage !== 'closed').length;
  const avgProbability =
    deals.length > 0
      ? Math.round(deals.reduce((sum, d) => sum + d.probability, 0) / deals.length)
      : 0;

  const statsCards = [
    {
      label: '管道总额',
      value: formatMoney(pipelineTotal),
      icon: DollarSign,
      color: ACCENT_BLUE,
    },
    {
      label: '成交预测',
      value: formatMoney(forecastTotal),
      icon: Target,
      color: ACCENT_GREEN,
    },
    {
      label: '活跃交易数',
      value: activeDeals,
      icon: Users,
      color: ACCENT_PURPLE,
    },
    {
      label: '平均成交概率',
      value: `${avgProbability}%`,
      icon: CheckCircle,
      color: ACCENT_AMBER,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: DARK_BG,
        color: TEXT_PRIMARY,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: '32px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <GitPullRequest size={28} color={ACCENT_BLUE} />
          成交 Pipeline
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: TEXT_SECONDARY,
            margin: '8px 0 0 0',
            paddingLeft: '40px',
          }}
        >
          销售漏斗与成交预测
        </p>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                backgroundColor: DARK_CARD,
                border: `1px solid ${DARK_BORDER}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: `${stat.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={22} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: TEXT_SECONDARY, marginBottom: '4px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: TEXT_PRIMARY }}>
                  {stat.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Kanban Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
          gap: '12px',
          minHeight: '400px',
        }}
      >
        {stageData.map((stage) => (
          <div
            key={stage.key}
            style={{
              backgroundColor: DARK_CARD,
              border: `1px solid ${DARK_BORDER}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Stage Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: `2px solid ${stage.color}44`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: stage.color,
                  }}
                />
                <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY }}>
                  {stage.label}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: TEXT_SECONDARY }}>{stage.count}单</span>
                <span style={{ color: TEXT_MUTED }}>{formatMoney(stage.totalAmount)}</span>
              </div>
            </div>

            {/* Deal Cards */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stage.deals.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: TEXT_MUTED,
                    fontSize: '13px',
                    padding: '24px 0',
                  }}
                >
                  暂无交易
                </div>
              )}
              {stage.deals.map((deal) => {
                const isSelected = selectedDealId === deal.id;
                const daysLeft = getDaysUntil(deal.expectedDate);
                return (
                  <div
                    key={deal.id}
                    onClick={() => {
                      setSelectedDealId(isSelected ? null : deal.id);
                    }}
                    style={{
                      backgroundColor: isSelected ? DARK_CARD_HOVER : 'transparent',
                      border: `1px solid ${isSelected ? stage.color + '66' : DARK_BORDER}`,
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = DARK_CARD_HOVER;
                      e.currentTarget.style.borderColor = stage.color + '44';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = DARK_BORDER;
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: TEXT_PRIMARY,
                        marginBottom: '8px',
                      }}
                    >
                      {deal.customer}
                    </div>

                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: stage.color,
                        marginBottom: '6px',
                      }}
                    >
                      {formatMoney(deal.amount)}
                    </div>

                    {/* Probability Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: '4px',
                          backgroundColor: DARK_BORDER,
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${deal.probability}%`,
                            height: '100%',
                            backgroundColor: stage.color,
                            borderRadius: '2px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: TEXT_SECONDARY, fontWeight: 600 }}>
                        {deal.probability}%
                      </span>
                    </div>

                    {/* Expected close date */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: TEXT_MUTED,
                        marginBottom: '4px',
                      }}
                    >
                      <Clock size={11} />
                      <span>
                        {formatDate(deal.expectedDate)}
                        {daysLeft > 0
                          ? ` (${daysLeft}天后)`
                          : daysLeft === 0
                          ? ' (今日)'
                          : ' (已逾期)'}
                      </span>
                    </div>

                    {/* Notes */}
                    {deal.notes && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: TEXT_SECONDARY,
                          lineHeight: 1.4,
                          marginBottom: '8px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {deal.notes}
                      </div>
                    )}

                    {/* Advance button */}
                    {stage.key !== 'closed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          advanceDeal(deal.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          padding: '8px 0',
                          marginTop: '4px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${DARK_BORDER}`,
                          borderRadius: '8px',
                          color: stage.color,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = stage.color + '18';
                          e.currentTarget.style.borderColor = stage.color + '66';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = DARK_BORDER;
                        }}
                      >
                        推进至下一阶段
                        <ArrowRight size={14} />
                      </button>
                    )}

                    {stage.key === 'closed' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 0',
                          marginTop: '4px',
                          color: ACCENT_GREEN,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle size={14} />
                        已成交
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipeline;

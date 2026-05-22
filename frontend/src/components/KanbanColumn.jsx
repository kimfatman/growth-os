import { MoreHorizontal } from 'lucide-react';

const STAGE_COLORS = {
  lead: 'border-gray-500/50',
  interested: 'border-blue-500/50',
  intent: 'border-blue-500/50',
  quoted: 'border-yellow-500/50',
  negotiating: 'border-purple-500/50',
  closed: 'border-green-500/50',
};

const STAGE_LABELS = {
  lead: '线索', interested: '意向', intent: '意向', quoted: '报价',
  negotiating: '谈判', closed: '成交',
};

export default function KanbanColumn({ stage, deals = [], onDealClick, onStageChange, className = '' }) {
  const borderColor = STAGE_COLORS[stage] || STAGE_COLORS.lead;

  return (
    <div className={`flex-shrink-0 w-72 bg-card rounded-xl border ${borderColor} flex flex-col max-h-full ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">{STAGE_LABELS[stage] || stage}</span>
          <span className="text-xs text-text-muted bg-white/5 px-1.5 py-0.5 rounded-full">{deals.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {deals.map(deal => (
          <div
            key={deal.id}
            className="bg-bg rounded-lg p-3 cursor-pointer hover:bg-card-hover transition-colors border border-border/50"
            onClick={() => onDealClick?.(deal)}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-medium text-text text-sm">{deal.customer_name}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>¥{typeof deal.amount === 'number' ? deal.amount.toLocaleString() : deal.amount}</span>
              <span>{Math.round((deal.probability || 0) * 100)}%</span>
            </div>
            {deal.expected_close && (
              <div className="mt-2 text-xs text-text-muted">
                {deal.expected_close} 预计关闭
              </div>
            )}
          </div>
        ))}
        {deals.length === 0 && (
          <div className="text-center py-8 text-xs text-text-muted">暂无交易</div>
        )}
      </div>
    </div>
  );
}

export { STAGE_LABELS, STAGE_COLORS };

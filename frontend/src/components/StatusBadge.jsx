const STATUS_STYLES = {
  lead: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  interested: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  intent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  quoted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  negotiating: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  closed: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  qualified: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  converted: 'bg-green-500/20 text-green-400 border-green-500/30',
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  published: 'bg-green-500/20 text-green-400 border-green-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const STATUS_LABELS = {
  lead: '线索', interested: '意向', intent: '意向', quoted: '报价',
  negotiating: '谈判', closed: '成交',
  pending: '待处理', qualified: '已识别', contacted: '已联系', converted: '已转化',
  draft: '草稿', published: '已发布',
  high: '高', medium: '中', low: '低',
};

export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${style} ${className}`}>
      {label}
    </span>
  );
}

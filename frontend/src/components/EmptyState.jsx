export default function EmptyState({ icon = '📭', title = '暂无数据', description = '', action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4 opacity-50">{icon}</span>
      <h3 className="text-lg font-medium text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

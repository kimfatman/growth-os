import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, change = null, color = 'primary', className = '' }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
  };

  const isPositive = change !== null && change >= 0;
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`bg-card rounded-xl p-4 border border-border hover:bg-card-hover transition-colors ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color] || colors.primary}`}>
          {Icon && <Icon size={20} />}
        </div>
        {change !== null && (
          <span className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
            <ChangeIcon size={14} />
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-text-muted text-sm mb-1">{label}</p>
        <p className="text-2xl font-bold text-text">{value}</p>
      </div>
    </div>
  );
}

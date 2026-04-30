import { ChevronRight } from 'lucide-react';

export default function ListItem({ label, value, sublabel, status, statusColor, onClick, border = true }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 active:opacity-70 transition-opacity cursor-pointer"
      style={{
        minHeight: 52,
        padding: '10px 0',
        borderBottom: border ? '1px solid var(--border-color)' : 'none',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 400 }}>{label}</span>
          {status && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: statusColor ? `${statusColor}20` : 'var(--border-color)',
                color: statusColor || 'var(--text-secondary)',
                fontSize: 11,
              }}
            >
              {status}
            </span>
          )}
        </div>
        {sublabel && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
      {value !== undefined && value !== null && (
        <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {value}
        </span>
      )}
      {onClick && (
        <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      )}
    </div>
  );
}

export default function ProgressBar({ value = 0, max = 100, color = 'bg-primary', className = '' }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={`w-full h-2 bg-white/5 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

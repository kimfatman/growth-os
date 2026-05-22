export default function FilterChip({ label, active = false, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer border
        ${active
          ? 'bg-primary text-white border-primary'
          : 'bg-card text-text-secondary border-border hover:bg-card-hover'
        } ${className}`}
    >
      {label}
    </button>
  );
}

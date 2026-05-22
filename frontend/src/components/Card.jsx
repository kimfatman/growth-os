export default function Card({ children, className = '', style, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 ${onClick ? 'active:opacity-80' : ''} ${className}`}
      style={{
        background: 'var(--bg-card)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

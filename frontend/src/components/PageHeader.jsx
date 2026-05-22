export default function PageHeader({ icon, title, subtitle, action = null }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div>
          <h1 className="text-xl font-bold text-text">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

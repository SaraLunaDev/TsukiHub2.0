import "./StatSection.css";

export default function StatSection({
  title,
  icon,
  subtitle,
  expanded,
  onToggle,
  children,
  searchBar,
}) {
  return (
    <div className="stat-section">
      <div className="stat-section-header">
        <div className="stat-section-title-row">
          {onToggle && (
            <button
              className="stat-section-toggle"
              onClick={onToggle}
              aria-label={expanded ? `Ocultar ${title}` : `Mostrar ${title}`}
            >
              {icon}
            </button>
          )}
          <h2 className="stat-section-title">{title}</h2>
        </div>
        {subtitle && <span className="stat-section-subtitle">{subtitle}</span>}
      </div>
      {searchBar}
      <div className="stat-section-content">{children}</div>
    </div>
  );
}

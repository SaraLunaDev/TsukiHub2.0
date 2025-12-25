export default function YearFilter({ years, selected, onChange }) {
  return (
    <div className="year-filter">
      <label htmlFor="year-select" className="filter-text">
        Año:
      </label>
      <select
        id="year-select"
        className="filter-spinner year-spinner"
        value={selected || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Todos</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

import React from "react";

export default function TypeFilter({ options, selected, onChange, label }) {
  return (
    <div className="type-filter">
      <label htmlFor="type-select" className="filter-text">
        {label}:
      </label>
      <select
        id="type-select"
        className="filter-spinner type-spinner"
        value={selected || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Todos</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

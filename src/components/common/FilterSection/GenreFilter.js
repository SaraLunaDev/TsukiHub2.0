import React from "react";
import "./FilterSection.css";

export default function GenreFilter({ options, value, onChange }) {
  return (
    <div className="genre-filter">
      <label htmlFor="genre-select" className="filter-text">
        Genero:
      </label>
      <select
        className="filter-spinner genre-spinner"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Todos</option>
        {options.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    </div>
  );
}

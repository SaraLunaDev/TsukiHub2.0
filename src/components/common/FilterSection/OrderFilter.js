import React from "react";

export default function OrderFilter({ value, onChange }) {
  return (
    <div className="order-filter">
      <label htmlFor="order-select" className="filter-text">
        Orden:
      </label>
      <select
        id="order-select"
        className="filter-spinner order-spinner"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="desc">▾ Fecha</option>
        <option value="asc">▴ Fecha</option>
        <option disabled style={{ fontSize: "0.7em" }}>
          ────────────
        </option>
        <option value="nota-desc">▾ Nota</option>
        <option value="nota-asc">▴ Nota</option>
        <option disabled style={{ fontSize: "0.7em" }}>
          ────────────
        </option>
        <option value="duracion-desc">▾ Horas</option>
        <option value="duracion-asc">▴ Horas</option>
        <option disabled style={{ fontSize: "0.7em" }}>
          ────────────
        </option>
        <option value="name-az">▾ Nombre</option>
        <option value="name-za">▴ Nombre</option>
      </select>
    </div>
  );
}

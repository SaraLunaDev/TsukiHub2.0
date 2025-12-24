import React from "react";
import "./FilterSection.css";

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      className="filter-searchbar"
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || "Buscar..."}
    />
  );
}

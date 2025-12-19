import React from "react";
import { Icon } from "@iconify/react";
import "./SearchBar.css";

function SearchBar({
  placeholder = "Buscar...",
  value,
  onChange,
  className = "",
}) {
  return (
    <div className={`search-bar ${className}`}>
      <div className="search-input-container">
        <Icon
          icon="streamline-sharp:magnifying-glass-solid"
          className="search-icon"
          width="16"
          height="16"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-input-field"
        />
      </div>
    </div>
  );
}

export default SearchBar;

import "./SearchBar.css";

import { StreamlineSharpMagnifyingGlassSolid } from "../../icons/StreamlineSharpMagnifyingGlassSolid";

import { useId } from "react";

function SearchBar({
  placeholder = "Buscar...",
  value,
  onChange,
  className = "",
  inputId,
}) {
  const generatedId = useId();
  const id = inputId || `search-bar-input-${generatedId}`;

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-input-container">
        <StreamlineSharpMagnifyingGlassSolid
          className="search-icon"
          width="16"
          height="16"
        />
        <input
          type="text"
          id={id}
          name="search"
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

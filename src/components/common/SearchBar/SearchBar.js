import "./SearchBar.css";

import { StreamlineSharpMagnifyingGlassSolid } from "../../icons/StreamlineSharpMagnifyingGlassSolid";
import { MdiChevronDown } from "../../icons/MdiChevronDown";

import { useId } from "react";

function SearchBar({
  placeholder = "Buscar...",
  value,
  onChange,
  className = "",
  inputId,
  onInputClick,
  showChevronButton = false,
  onChevronClick,
  isChevronOpen = false,
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
          onClick={onInputClick}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {showChevronButton && (
          <button
            type="button"
            className="search-chevron-button"
            onClick={onChevronClick}
            aria-label="Toggle ranking"
          >
            <MdiChevronDown
              className={`search-chevron-icon ${isChevronOpen ? "open" : ""}`}
              width="16"
              height="16"
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;

import React, { useState } from "react";
import "./PokemonCard.css";
import { PokeBall } from "../../icons/Pokemon/PokeBall";

function PokemonCard({ pokemon, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = (e) => {
    e.target.src = pokemon.staticUrl;
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const handleClick = () => {
    if (pokemon.captured && onClick) {
      onClick(pokemon);
    }
  };

  if (!pokemon.id) {
    return <div className="pokemon-card empty-slot"></div>;
  }

  return (
    <div
      className={`pokemon-card ${
        pokemon.captured
          ? pokemon.shiny
            ? "shiny"
            : "captured"
          : "default"
      }`}
      onClick={handleClick}
      style={{ cursor: pokemon.captured ? "pointer" : "default" }}
    >
      {!imageLoaded && <PokeBall className="pokemon-placeholder" />}
      <img
        src={pokemon.staticUrl}
        alt={`Pokemon ${pokemon.id}`}
        className={`pokemon-img ${imageLoaded ? "loaded" : ""}`}
        onError={handleError}
        onLoad={handleLoad}
      />
      {pokemon.shiny && <span className="shiny-icon">✨</span>}
    </div>
  );
}

export default PokemonCard;

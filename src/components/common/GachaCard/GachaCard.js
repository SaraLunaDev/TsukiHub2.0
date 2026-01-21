import React, { useState } from "react";
import "./GachaCard.css";
import { StreamlineFlexGamblingRemix } from "../../icons/StreamlineFlexGamblingRemix";

function GachaCard({ character, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const handleClick = () => {
    if (character.owned && onClick) {
      onClick(character);
    }
  };

  if (!character.id) {
    return <div className="gacha-card empty-slot"></div>;
  }

  return (
    <div
      className={`gacha-card ${character.owned ? "owned" : "default"}`}
      data-banner={character.banner}
      onClick={handleClick}
      style={{ cursor: character.owned ? "pointer" : "default" }}
    >
      {!imageLoaded && (
        <StreamlineFlexGamblingRemix className="gacha-placeholder" />
      )}
      <img
        src={character.lowUrl}
        alt={character.name}
        className={`gacha-img ${imageLoaded ? "loaded" : ""}`}
        onLoad={handleLoad}
      />
    </div>
  );
}

export default GachaCard;

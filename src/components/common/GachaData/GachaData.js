import React from "react";
import "./GachaData.css";
import HoverCard from "../HoverCard/HoverCard";

function GachaData({ selectedCharacter, banner }) {
  const hasCard = !!selectedCharacter;
  const bannerId = banner || selectedCharacter?.banner || "";

  return (
    <div className="gacha-data normal-section">
      <div className="gacha-display-section">
        <HoverCard
          src={hasCard ? selectedCharacter.highUrl : undefined}
          alt={hasCard ? selectedCharacter.name : undefined}
          banner={hasCard ? bannerId : undefined}
          tier={hasCard ? selectedCharacter.tier : undefined}
          lockToBack={!hasCard}
        />
      </div>
    </div>
  );
}

export default GachaData;

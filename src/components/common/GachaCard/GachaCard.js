import React, { useState } from "react";
import "./GachaCard.css";

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
				<img
					src="/static/resources/gacha/back.webp"
					alt="back"
					className="gacha-placeholder gacha-placeholder-img"
				/>
			)}
			<img
				src={
					character.owned
						? character.lowUrl
						: "/static/resources/gacha/back.webp"
				}
				alt={character.owned ? character.name : "back"}
				className={`gacha-img ${imageLoaded ? "loaded" : ""} ${character.owned ? "" : "back-img"}`}
				onLoad={handleLoad}
			/>
		</div>
	);
}

export default GachaCard;

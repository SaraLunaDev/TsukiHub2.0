import React from "react";
import "./HoverCard.css";

export default function HoverCardBack({
  src = "/static/back.webp",
  alt = "card back",
}) {
  return (
    <div className="card__back-overlay" aria-hidden="true">
      <img src={src} alt={alt} className="card__back-img" />
    </div>
  );
}

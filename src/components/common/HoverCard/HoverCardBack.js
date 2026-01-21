import React from "react";
import "./HoverCard.css";

export default function HoverCardBack({
  src = "/static/back.webp",
  alt = "card back",
  className = "",
}) {
  return (
    <div
      className={`card__back-overlay${className ? " " + className : ""}`}
      aria-hidden="true"
    >
      <img src={src} alt={alt} className="card__back-img" />
    </div>
  );
}

import React, { useState } from "react";
import "./ItemCaratula.css";
import { MaterialSymbolsPlayArrowRounded } from "../../icons/MaterialSymbolsPlayArrowRounded";
import { MaterialSymbolsLightKidStar } from "../../icons/MaterialSymbolsLightKidStar";
import { MaterialSymbolsAlarm } from "../../icons/MaterialSymbolsAlarm";

export default function ItemCaratula({
  Caratula,
  Nombre,
  Trailer,
  Fecha,
  Duracion,
  Nota,
  URL,
}) {
  const [hover, setHover] = useState(false);
  if (!Caratula) return null;
  return (
    <div
      className="item-caratula"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="item-img-wrapper">
        {Duracion && (
          <div className="item-duracion-superpuesta">
            <MaterialSymbolsAlarm
              style={{ marginRight: 4, marginBottom: -2 }}
            />
            {Duracion}
          </div>
        )}
        {URL && (
          <button
            className="item-url-btn"
            onClick={(e) => {
              e.stopPropagation();
              window.open(URL, "_blank");
            }}
          >
            <MaterialSymbolsPlayArrowRounded className="item-url-icon" />
          </button>
        )}
        {Nota && (
          <div className="item-nota-superpuesta">
            <MaterialSymbolsLightKidStar
              style={{ marginRight: 4, marginBottom: -2 }}
            />
            {Number(Nota).toFixed(1).replace(/\.0$/, "")}/10
          </div>
        )}
        <img
          src={Caratula}
          alt={`Caratula de ${
            Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""
          }`}
          className="item-img"
        />
        <div className="item-img-overlay" />
        {Fecha && <div className="item-fecha-superpuesta">{Fecha}</div>}
      </div>
      {Trailer && Nombre ? (
        hover ? (
          <button
            className="item-trailer-btn"
            onClick={(e) => {
              e.stopPropagation();
              window.open(Trailer, "_blank");
            }}
          >
            <MaterialSymbolsPlayArrowRounded
              style={{ fontSize: 18, marginRight: 4 }}
            />
            Trailer
          </button>
        ) : (
          <div className="item-nombre">
            {Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""}
          </div>
        )
      ) : (
        Nombre && (
          <div className="item-nombre">
            {Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""}
          </div>
        )
      )}
    </div>
  );
}

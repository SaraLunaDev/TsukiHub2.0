import React, { useState } from "react";
import { MaterialSymbolsAndroidMessages } from "../../icons/MaterialSymbolsAndroidMessages";
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
  Estado,
  Usuario,
  userSheet,
  Comentario,
}) {
  const [hover, setHover] = useState(false);
  const caratulaClass =
    Estado === "Recomendacion"
      ? "item-caratula item-caratula-recomendacion"
      : "item-caratula";

  return (
    <div
      className={caratulaClass}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {Estado === "Recomendacion" && userSheet && (
        <div className="item-nombre-superpuesta">
          {userSheet.pfp ? (
            <img
              src={userSheet.pfp}
              alt={userSheet.nombre || "Usuario"}
              className="item-usuario-avatar"
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
          ) : null}
          <span>{userSheet.nombre || "Usuario"}</span>
        </div>
      )}
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
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <img
            src={Caratula}
            alt={`Caratula de ${
              Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""
            }`}
            className={
              Estado === "Recomendacion"
                ? "item-img item-img-recomendacion"
                : "item-img"
            }
          />
          {Estado === "Recomendacion" && hover && Comentario && (
            <div className="item-comentario-overlay">
              <MaterialSymbolsAndroidMessages
                style={{
                  fontSize: 18,
                  marginBottom: 2,
                  marginRight: 6,
                  verticalAlign: "middle",
                  color: "#fff",
                }}
              />
              <span>{Comentario}</span>
            </div>
          )}
        </div>
        {(Duracion || Nota || (Estado === "Recomendacion" && Comentario)) && (
          <div
            className={
              Estado === "Recomendacion"
                ? "item-img-overlay-recomendacion"
                : "item-img-overlay-normal"
            }
          />
        )}
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
            <MaterialSymbolsPlayArrowRounded className="item-url-icon" />
            <span style={{ marginLeft: 6 }}>Trailer</span>
          </button>
        ) : null
      ) : null}
      <div className="item-nombre">
        {Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""}
      </div>
    </div>
  );
}

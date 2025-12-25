import React from "react";
import { MaterialSymbolsPlayArrowRounded } from "../../icons/MaterialSymbolsPlayArrowRounded";
import "./ItemImagen.css";

export default function ItemImagen({
  Imagen,
  Nombre,
  Resumen,
  Trailer,
  Generos,
}) {
  if (!Imagen) return null;
  return (
    <div className="item-imagen-wrapper">
      <img
        src={Imagen}
        alt={
          Nombre ? `Imagen de ${Nombre.replace(/\s*\[[^\]]*\]$/, "")}` : "Item"
        }
        className="item-imagen-img"
      />
      <div className="item-imagen-overlay" />
      <div className="item-imagen-content">
        <header className="item-imagen-header">
          {Nombre && (
            <h2 className="item-imagen-nombre">
              {Nombre.replace(/\s*\[[^\]]*\]$/, "")}
            </h2>
          )}
          {Resumen && <p className="item-imagen-resumen">{Resumen}</p>}
        </header>
        <footer className="item-imagen-footer">
          {Trailer && (
            <button
              className="item-imagen-trailer-btn"
              onClick={(e) => {
                e.stopPropagation();
                window.open(Trailer, "_blank");
              }}
            >
              <MaterialSymbolsPlayArrowRounded
                style={{ fontSize: 18, marginRight: 4 }}
              />
              Ver Trailer
            </button>
          )}
          {Generos && (
            <div className="item-imagen-generos">
              {Generos.split(",").map((g, i) => (
                <span key={i} className="item-imagen-genero">
                  {g.trim()}
                </span>
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

import { useState } from "react";
import { MaterialSymbolsPlayArrowRounded } from "../../icons/MaterialSymbolsPlayArrowRounded";
import { MdiChevronDown } from "../../icons/MdiChevronDown";
import { MdiChevronUp } from "../../icons/MdiChevronUp";
import "./ItemImagenList.css";
import { MaterialSymbolsLightKidStar } from "../../icons/MaterialSymbolsLightKidStar";

export default function ItemImagenList({
  Imagen,
  Nombre,
  Resumen,
  Trailer,
  Generos,
  Fecha_Salida,
  Tipo,
  Creador,
  Nota_Global,
  Nota,
  Caratula,
  Duracion,
  URL,
  Usuario,
  userSheet,
  Comentario,
  Estado,
}) {
  const [expand, setExpand] = useState(false);
  let nombrePrincipal = Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : "";
  let nombreSecundario = null;
  if (Nombre) {
    const match = Nombre.match(/\[([^\]]+)\]/);
    if (match) {
      nombreSecundario = match[1];
    }
  }
  let tipoStr = Array.isArray(Tipo) ? Tipo.join(", ") : Tipo || "";
  let tipoSinParentesis = tipoStr ? tipoStr.replace(/\s*\([^)]*\)/g, "") : "";

  return (
    <div className={`item-imagen-list-wrapper${expand ? " expanded" : ""}`}>
      {Imagen ? (
        <img
          src={Imagen}
          alt={Nombre ? `Imagen de ${nombrePrincipal}` : "Item"}
          className="item-imagen-list-img"
        />
      ) : (
        <div className="item-imagen-list-img item-imagen-list-img-placeholder" />
      )}
      <div className="item-imagen-list-overlay" />
      <div className="item-imagen-list-content-caratula">
        <div className="item-imagen-list-content-main">
          <header className="item-imagen-list-header">
            <div className="item-imagen-list-nombre-row">
              <button
                className="item-imagen-list-chevron"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpand((v) => !v);
                }}
                aria-label={expand ? "Ocultar resumen" : "Mostrar resumen"}
                tabIndex={0}
              >
                {expand ? (
                  <MdiChevronUp style={{ fontSize: 22 }} />
                ) : (
                  <MdiChevronDown style={{ fontSize: 22 }} />
                )}
              </button>
              {nombrePrincipal && (
                <h2 className="item-imagen-list-nombre">{nombrePrincipal}</h2>
              )}
            </div>
            {(nombreSecundario ||
              Fecha_Salida ||
              tipoSinParentesis ||
              Creador ||
              Duracion) && (
              <div className="item-imagen-list-nombre-secundario-row">
                {(Fecha_Salida || tipoSinParentesis || Creador || Duracion) && (
                  <div className="item-imagen-list-fecha-tipo">
                    {nombreSecundario && (
                      <>
                        <span className="item-imagen-list-nombre-secundario">
                          {nombreSecundario}
                        </span>
                        {tipoSinParentesis && <span> · </span>}
                      </>
                    )}
                    {tipoSinParentesis && <span>{tipoSinParentesis}</span>}
                    {tipoSinParentesis && Duracion && <span> · </span>}
                    {Duracion && <span>{Duracion}</span>}
                    {(tipoSinParentesis || Duracion) && Fecha_Salida && (
                      <span> · </span>
                    )}
                    {Fecha_Salida && <span>{Fecha_Salida}</span>}
                    {(Fecha_Salida || tipoSinParentesis || Duracion) &&
                      Creador && <span> · </span>}
                    {Creador && <span>{Creador}</span>}
                  </div>
                )}
              </div>
            )}
          </header>
          {Usuario && Comentario && (
            <>
              <div
                className={`item-imagen-list-comentario${
                  expand ? " expanded" : ""
                }`}
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {userSheet && userSheet.pfp ? (
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
                  <span style={{ fontWeight: "bold" }}>
                    {userSheet?.nombre || "Usuario"}:
                  </span>
                </div>
                <span style={{ color: "var(--text-2)", marginTop: 2 }}>
                  {Comentario}
                </span>
              </div>
              {expand && (
                <hr
                  style={{
                    width: "100%",
                    border: 0,
                    borderTop: "1px solid var(--divider)",
                    margin: "8px 0 8px 0",
                  }}
                />
              )}
            </>
          )}
          {Resumen && (
            <>
              <p
                className={`item-imagen-list-resumen${
                  expand ? " expanded" : ""
                }${Usuario && Comentario ? " con-usuario" : ""}`}
              >
                {Resumen}
              </p>
            </>
          )}

          <footer className="item-imagen-list-footer">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {URL && (
                <button
                  className="item-imagen-list-trailer-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(URL, "_blank");
                  }}
                >
                  <span className="vod-icon-desktop">
                    <MaterialSymbolsPlayArrowRounded
                      style={{ fontSize: 18, marginRight: 4 }}
                    />
                    Ver VOD
                  </span>
                  <span className="vod-text-mobile">VOD</span>
                </button>
              )}
              {Trailer && (
                <button
                  className="item-imagen-list-trailer-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(Trailer, "_blank");
                  }}
                >
                  <span className="vod-icon-desktop">
                    <MaterialSymbolsPlayArrowRounded
                      style={{ fontSize: 18, marginRight: 4 }}
                    />
                    Ver Trailer
                  </span>
                  <span className="vod-text-mobile">Trailer</span>
                </button>
              )}
              <span className="item-imagen-list-nota-global">
                <MaterialSymbolsLightKidStar
                  className="item-imagen-list-nota-estrella"
                  style={{
                    fontSize: 18,
                    verticalAlign: "middle",
                    marginRight: 2,
                    marginTop: 2,
                  }}
                />
                <span className="item-imagen-list-nota-texto">
                  {Estado && Estado.toLowerCase().includes("recomendacion")
                    ? Nota_Global !== undefined &&
                      Nota_Global !== null &&
                      Nota_Global !== ""
                      ? Number(Number(Nota_Global).toFixed(2)).toString()
                      : "N/A"
                    : Nota !== undefined && Nota !== null && Nota !== ""
                    ? Number(Number(Nota).toFixed(2)).toString()
                    : "N/A"}
                </span>
              </span>
            </div>
            {Generos && (
              <div className="item-imagen-list-generos">
                {Generos.split(",").map((g, i) => (
                  <span key={i} className="item-imagen-list-genero">
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}
          </footer>
        </div>
        {Caratula && (
          <div className="item-imagen-list-caratula-container">
            <img
              src={Caratula}
              alt="Caratula"
              className="item-imagen-list-caratula"
            />
          </div>
        )}
      </div>
    </div>
  );
}

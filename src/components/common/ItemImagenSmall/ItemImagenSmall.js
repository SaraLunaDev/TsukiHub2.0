import { MaterialSymbolsPlayArrowRounded } from "../../icons/MaterialSymbolsPlayArrowRounded";
import "./ItemImagenSmall.css";
import { MaterialSymbolsLightKidStar } from "../../icons/MaterialSymbolsLightKidStar";

export default function ItemImagenSmall({
  Imagen,
  Nombre,
  Resumen,
  Trailer,
  Generos,
  Fecha_Salida,
  Tipo,
  Creador,
  Nota_Global,
  Caratula,
  Duracion,
}) {
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
    <div className="item-imagen-small-wrapper">
      {Imagen ? (
        <img
          src={Imagen}
          alt={Nombre ? `Imagen de ${nombrePrincipal}` : "Item"}
          className="item-imagen-small-img"
        />
      ) : (
        <div className="item-imagen-small-img item-imagen-small-img-placeholder" />
      )}
      <div className="item-imagen-small-overlay" />
      <div className="item-imagen-small-content-caratula">
        <div className="item-imagen-small-content-main">
          <header className="item-imagen-small-header">
            {nombrePrincipal && (
              <h2 className="item-imagen-small-nombre">{nombrePrincipal}</h2>
            )}
            {(nombreSecundario ||
              Fecha_Salida ||
              tipoSinParentesis ||
              Creador ||
              Duracion) && (
              <div className="item-imagen-small-nombre-secundario-row">
                {(Fecha_Salida || tipoSinParentesis || Creador || Duracion) && (
                  <div className="item-imagen-small-fecha-tipo">
                    {nombreSecundario && (
                      <>
                        <span className="item-imagen-small-nombre-secundario">
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

          {Resumen && <p className="item-imagen-small-resumen">{Resumen}</p>}
          <footer className="item-imagen-small-footer">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {Trailer && (
                <button
                  className="item-imagen-small-trailer-btn"
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
              <span className="item-imagen-small-nota-global">
                <MaterialSymbolsLightKidStar
                  className="item-imagen-small-nota-estrella"
                  style={{
                    fontSize: 18,
                    verticalAlign: "middle",
                    marginRight: 2,
                    marginTop: 2,
                  }}
                />
                <span className="item-imagen-small-nota-texto">
                  {Nota_Global
                    ? Number(Number(Nota_Global).toFixed(2)).toString()
                    : "N/A"}{" "}
                </span>
              </span>
            </div>
            {Generos && (
              <div className="item-imagen-small-generos">
                {Generos.split(",").map((g, i) => (
                  <span key={i} className="item-imagen-small-genero">
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}
          </footer>
        </div>
        {Caratula && (
          <div className="item-imagen-small-caratula-container">
            <img
              src={Caratula}
              alt="Caratula"
              className="item-imagen-small-caratula"
            />
          </div>
        )}
      </div>
    </div>
  );
}

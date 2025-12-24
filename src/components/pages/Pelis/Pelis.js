import React from "react";
import "./Pelis.css";
import ItemCaratula from "../../common/ItemCaratula/ItemCaratula";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";

const SHEET_URL = process.env.REACT_APP_PELIS_SHEET_URL;

function Pelis() {
  const { data, loading, error } = useGoogleSheet(SHEET_URL);

  return (
    <div className="main-container">
      <div className="top-section">
        <h2>Peliculas y Series Vistas</h2>
        <div className="top-section-h2-down">
          <span>
            <b>
              {data
                ? data.filter(
                    (row) => (row["Estado"] || "").toLowerCase() === "pasado"
                  ).length
                : 0}
            </b>{" "}
            entrada
            {data &&
            data.filter(
              (row) => (row["Estado"] || "").toLowerCase() === "pasado"
            ).length === 1
              ? ""
              : "s"}
          </span>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", margin: "2em 0" }}>Cargando...</div>
      ) : error ? (
        <div style={{ color: "red", textAlign: "center", margin: "2em 0" }}>
          {error}
        </div>
      ) : (
        <div className="inset-section">
          {data && data.length > 0 ? (
            <div className="pelis-grid">
              {data
                .filter(
                  (row) => (row["Estado"] || "").toLowerCase() === "pasado"
                )
                .sort((a, b) => {
                  const parse = (d) => {
                    if (!d) return 0;
                    const [day, month, year] = d.split("/").map(Number);
                    return new Date(year, month - 1, day).getTime();
                  };
                  return parse(b["Fecha"]) - parse(a["Fecha"]);
                })
                  .map((row, idx) => (
                    <ItemCaratula key={idx} {...row} />
                ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 32 }}>
              No hay datos disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Pelis;

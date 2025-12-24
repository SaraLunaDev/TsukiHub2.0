import React, { useState } from "react";
import "./Pelis.css";
import ItemCaratula from "../../common/ItemCaratula/ItemCaratula";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";

import FilterSection from "../../common/FilterSection/FilterSection";
import YearFilter from "../../common/FilterSection/YearFilter";
import OrderFilter from "../../common/FilterSection/OrderFilter";
import TypeFilter from "../../common/FilterSection/TypeFilter";
import SearchBar from "../../common/FilterSection/SearchBar";
import GenreFilter from "../../common/FilterSection/GenreFilter";

const SHEET_URL = process.env.REACT_APP_PELIS_SHEET_URL;

function Pelis() {
  const { data, loading, error } = useGoogleSheet(SHEET_URL);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [order, setOrder] = useState("desc");
  const [selectedType, setSelectedType] = useState("");
  const [searchText, setSearchText] = useState("");

  const genreOptions = React.useMemo(() => {
    if (!data) return [];
    const set = new Set();
    data
      .filter((row) => (row["Estado"] || "").toLowerCase() === "pasado")
      .forEach((row) => {
        if (row["Generos"]) {
          row["Generos"].split(",").forEach((g) => set.add(g.trim()));
        }
      });
    return Array.from(set).sort();
  }, [data]);
  const [selectedGenre, setSelectedGenre] = useState("");

  const cleanType = (str) =>
    str ? str.replace(/\s*\(.*?\)\s*/g, "").trim() : "";
  const typeOptions = React.useMemo(() => {
    if (!data) return [];
    const set = new Set();
    data
      .filter((row) => (row["Estado"] || "").toLowerCase() === "pasado")
      .forEach((row) => {
        if (row["Tipo"]) set.add(cleanType(row["Tipo"]));
      });
    return Array.from(set).sort();
  }, [data]);

  const years = React.useMemo(() => {
    if (!data) return [];
    const set = new Set();
    data
      .filter((row) => (row["Estado"] || "").toLowerCase() === "pasado")
      .forEach((row) => {
        if (row["Fecha"]) {
          const parts = row["Fecha"].split("/");
          if (parts.length === 3) set.add(parts[2]);
        }
      });
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

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
          <FilterSection
            label="Filtrar"
            open={showFilter}
            onClick={() => setShowFilter((v) => !v)}
            divProps={{ style: { display: "none" } }}
          />
        </div>
      </div>
      {showFilter && (
        <div className="filter-section">
          <OrderFilter value={order} onChange={setOrder} />
          <YearFilter
            years={years}
            selected={selectedYear}
            onChange={setSelectedYear}
          />
          <TypeFilter
            options={typeOptions}
            selected={selectedType}
            onChange={setSelectedType}
            label="Tipo"
          />
          <GenreFilter
            options={genreOptions}
            value={selectedGenre}
            onChange={setSelectedGenre}
          />
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Buscar..."
          />
        </div>
      )}
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
                .filter(
                  (row) =>
                    (!selectedYear ||
                      (row["Fecha"] &&
                        row["Fecha"].endsWith("/" + selectedYear))) &&
                    (!selectedType ||
                      cleanType(row["Tipo"]) === selectedType) &&
                    (!selectedGenre ||
                      (row["Generos"] &&
                        row["Generos"]
                          .split(",")
                          .map((g) => g.trim())
                          .includes(selectedGenre))) &&
                    (!searchText ||
                      Object.values(row).some(
                        (v) =>
                          v &&
                          v
                            .toString()
                            .toLowerCase()
                            .includes(searchText.toLowerCase())
                      ))
                )
                .sort((a, b) => {
                  const parse = (d) => {
                    if (!d) return 0;
                    const [day, month, year] = d.split("/").map(Number);
                    return new Date(year, month - 1, day).getTime();
                  };
                  const parseDuration = (str) => {
                    if (!str) return 0;
                    str = str.replace(/\s+/g, "").toLowerCase();
                    let h = 0,
                      m = 0;
                    const hMatch = str.match(/(\d+)h/);
                    const mMatch = str.match(/(\d+)m/);
                    if (hMatch) h = parseInt(hMatch[1], 10);
                    if (mMatch) m = parseInt(mMatch[1], 10);
                    return h * 60 + m;
                  };
                  switch (order) {
                    case "asc":
                      return parse(a["Fecha"]) - parse(b["Fecha"]);
                    case "name-az":
                      return (a["Nombre"] || "").localeCompare(
                        b["Nombre"] || ""
                      );
                    case "name-za":
                      return (b["Nombre"] || "").localeCompare(
                        a["Nombre"] || ""
                      );
                    case "nota-desc":
                      return (
                        (Number(b["Nota"]) || 0) - (Number(a["Nota"]) || 0)
                      );
                    case "nota-asc":
                      return (
                        (Number(a["Nota"]) || 0) - (Number(b["Nota"]) || 0)
                      );
                    case "duracion-desc":
                      return (
                        parseDuration(b["Duracion"]) -
                        parseDuration(a["Duracion"])
                      );
                    case "duracion-asc":
                      return (
                        parseDuration(a["Duracion"]) -
                        parseDuration(b["Duracion"])
                      );
                    case "desc":
                    default:
                      return parse(b["Fecha"]) - parse(a["Fecha"]);
                  }
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

import React, { useMemo, useState } from "react";
import "./Recomendar.css";
import ItemCaratula from "../../common/ItemCaratula/ItemCaratula";
import ItemImagenList from "../../common/ItemImagenList/ItemImagenList";
import { MaterialSymbolsListsRounded } from "../../icons/MaterialSymbolsListsRounded";
import { TablerLayoutGridFilled } from "../../icons/TablerLayoutGridFilled";
import ItemImagenSmall from "../../common/ItemImagenSmall/ItemImagenSmall";
import SearchBar from "../../common/SearchBar/SearchBar";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { useLocation } from "react-router-dom";
import { API_URLS } from "../../../constants/config";

const SHEET_URLS = {
  juegos: process.env.REACT_APP_JUEGOS_SHEET_URL,
  pelis: process.env.REACT_APP_PELIS_SHEET_URL,
};
function Recomendar() {
  const handleSearchBarClick = () => {
    if (successMsg) setSuccessMsg("");
  };
  const location = useLocation();
  const isJuegos = location.pathname.includes("/juegos");
  const SHEET_URL = isJuegos ? SHEET_URLS.juegos : SHEET_URLS.pelis;
  const { data, loading, error } = useGoogleSheet(SHEET_URL);
  const userSheetUrl = process.env.REACT_APP_USERDATA_SHEET_URL;
  const { data: usersData } = useGoogleSheet(userSheetUrl, "userData");
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (row) => (row["Estado"] || "").toLowerCase() === "recomendacion"
    );
  }, [data]);

  const getUserById = (id) => {
    if (!usersData || !id) {
      return null;
    }
    const found = usersData.find(
      (u) => String(u.id).trim() === String(id).trim()
    );
    return found;
  };

  const title = isJuegos
    ? "Juegos Recomendados"
    : "Peliculas o Series Recomendadas";
  const titleRecomendar = isJuegos
    ? "Recomendar Juego"
    : "Recomendar Pelicula o Serie";
    
  // Forzar grid por defecto si no hay valor guardado
  const [isGrid, setIsGrid] = useLocalStorage(
    isJuegos ? "recomendar_juegos_isGrid" : "recomendar_pelis_isGrid",
    true
  );
  const gridClass = isGrid
    ? isJuegos
      ? "juegos-grid"
      : "pelis-grid"
    : "recomendar-list";

  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchResults, setSearchResults] = useState([]);

  const [selectedResult, setSelectedResult] = useState(null);

  const [comentario, setComentario] = useState("");

  const [selectedRecommendPlatform, setSelectedRecommendPlatform] =
    useState("");

  const [enviando, setEnviando] = useState(false);
  const [, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  const [user] = useLocalStorage("twitchUser", null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  React.useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    const timeout = setTimeout(() => {
      const doSearch = async () => {
        try {
          let url = isJuegos ? API_URLS.IGDB_SEARCH : API_URLS.TMDB_SEARCH;
          let body = isJuegos
            ? { query: search }
            : { query: search, type: "multi" };
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (!res.ok || !data.results)
            throw new Error(data.error || "Error en busqueda");

          const normalized = data.results.map((item) => {
            const fixUrl = (url) => {
              if (!url) return undefined;
              if (url.startsWith("http")) return url;
              if (url.startsWith("//")) return "https:" + url;
              return url;
            };
            if (isJuegos) {
              return {
                id: item.id,
                nombre: item.nombre || item.name,
                caratula: fixUrl(item.caratula || item.cover?.url),
                imagen: fixUrl(item.imagen),
                fecha:
                  item.fecha ||
                  (item.first_release_date
                    ? new Date(item.first_release_date * 1000).getFullYear()
                    : undefined),
                generos: item.generos || item.genres?.map((g) => g.name) || [],
                resumen: item.resumen || item.summary,
                trailer: item.trailer,
                tipo: item.tipo || "juego",
                creador: item.creador,
                nota_global:
                  typeof item.nota_global === "number"
                    ? (item.nota_global / 10).toFixed(1)
                    : item.nota_global,
                duracion: item.duracion,
                raw: item,
              };
            } else {
              return {
                id: item.id,
                nombre: item.nombre || item.title || item.name,
                caratula:
                  item.caratula ||
                  (item.poster_path || item.backdrop_path
                    ? `https://image.tmdb.org/t/p/w185${
                        item.poster_path || item.backdrop_path
                      }`
                    : undefined),
                fecha: item.fecha || item.release_date || item.first_air_date,
                generos:
                  item.generos ||
                  (item.genres
                    ? typeof item.genres === "string"
                      ? item.genres.split(",")
                      : item.genres
                    : []),
                resumen: item.resumen || item.overview,
                trailer: item.trailer_url || item.trailer,
                tipo: item.tipo || item.media_type,
                creador: item.creador,
                nota_global: item.nota_global,
                duracion: item.duracion,
                imagen: item.imagen,
                raw: item,
              };
            }
          });
          setSearchResults(normalized);
        } catch (e) {
          setSearchError(e.message);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      };
      doSearch();
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, isJuegos]);

  return (
    <main className="main-container">
      {user && (
        <div className="top-section" style={{ marginTop: 8, marginBottom: 0 }}>
          <h2>{titleRecomendar}</h2>
        </div>
      )}

      {user && (
        <div className="inset-section recomendar-section">
          <SearchBar
            placeholder={
              isJuegos
                ? "Nombre del juego a recomendar..."
                : "Nombre de la pelicula o serie a recomendar..."
            }
            value={search}
            onChange={setSearch}
            className="recomendar-searchbar"
            onInputClick={handleSearchBarClick}
          />
          {searchLoading && (
            <div
              style={{ marginTop: 15, color: "var(--text-2)", fontSize: 14 }}
            >
              Buscando...
            </div>
          )}
          {successMsg && !searchLoading && (
            <div style={{ marginTop: 15, color: "green", fontSize: 14 }}>
              {successMsg}
            </div>
          )}
          {searchError && (
            <div style={{ marginTop: 8, color: "var(--error)", fontSize: 14 }}>
              {searchError}
            </div>
          )}
          {search &&
            searchResults.length > 0 &&
            !searchLoading &&
            !searchError && (
              <div className="autocomplete-list">
                {searchResults.map((result, idx) => (
                  <div
                    key={result.id || idx}
                    className={`autocomplete-item${
                      idx !== searchResults.length - 1
                        ? " autocomplete-item-border"
                        : ""
                    }${
                      selectedResult && selectedResult.id === result.id
                        ? " autocomplete-item-selected"
                        : ""
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <ItemImagenSmall
                      Imagen={
                        result.imagen || result.caratula || result.Caratula
                      }
                      Nombre={result.nombre || result.title || result.name}
                      Resumen={result.resumen || result.overview}
                      Trailer={result.trailer}
                      Generos={
                        Array.isArray(result.generos)
                          ? result.generos.join(", ")
                          : result.generos
                      }
                      Fecha_Salida={result.fecha || result.fecha_salida}
                      Tipo={result.tipo || result.Tipo}
                      Creador={result.creador || result.Creador}
                      Nota_Global={result.nota_global || result.Nota_Global}
                      Caratula={result.caratula || result.Caratula}
                      Duracion={result.duracion || result.Duracion}
                    />
                  </div>
                ))}
              </div>
            )}
          {selectedResult && (
            <div
              className="selected-result-preview"
              style={{
                marginTop: 12,
                borderRadius: 8,
              }}
            >
              {isJuegos &&
                Array.isArray(selectedResult.tipo) &&
                selectedResult.tipo.length > 0 && (
                  <div style={{ margin: "16px 0" }}>
                    <label
                      htmlFor="recommend-platform-select"
                      style={{ fontWeight: 500 }}
                    >
                      Plataforma
                    </label>
                    <select
                      id="recommend-platform-select"
                      value={selectedRecommendPlatform}
                      onChange={(e) =>
                        setSelectedRecommendPlatform(e.target.value)
                      }
                    >
                      <option value="">Selecciona una plataforma...</option>
                      {selectedResult.tipo.map((platform, idx) => (
                        <option key={platform + idx} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              <form
                className="recomendar-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEnviando(true);
                  setErrorEnvio("");
                  setEnviado(false);
                  try {
                    const cleanResult = { ...selectedResult };
                    if (cleanResult.tipo) delete cleanResult.tipo;
                    if (cleanResult.raw && cleanResult.raw.tipo)
                      delete cleanResult.raw.tipo;

                    let tipoValue;
                    if (isJuegos) {
                      tipoValue =
                        selectedRecommendPlatform ||
                        (Array.isArray(selectedResult.tipo)
                          ? selectedResult.tipo[0]
                          : "");
                    } else {
                      tipoValue =
                        selectedResult.raw?.tipo || selectedResult.tipo || "";
                    }

                    const res = await fetch("/api/add-recommendation", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        item: {
                          ...cleanResult,
                          tipo: tipoValue,
                        },
                        user: user?.id || user?.login || "anon",
                        comment: comentario,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success)
                      throw new Error(data.error || "Error al enviar");
                    setEnviado(true);
                    setComentario("");
                    setSelectedResult(null);
                    setSelectedRecommendPlatform("");
                    setSearch("");
                    setSearchResults([]);
                    setSuccessMsg("¡Recomendacion enviada! Muchas gracias");
                  } catch (err) {
                    setErrorEnvio(err.message);
                  } finally {
                    setEnviando(false);
                  }
                }}
              >
                <div className="char-counter">
                  {100 - comentario.length} caracteres restantes
                </div>
                <textarea
                  placeholder="¿Algo que comentar sobre la recomendacion? (opcional)"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  maxLength={100}
                  style={{ resize: "none" }}
                  disabled={enviando}
                />
                <button
                  type="submit"
                  disabled={
                    enviando ||
                    !user ||
                    (isJuegos &&
                      Array.isArray(selectedResult.tipo) &&
                      selectedResult.tipo.length > 0 &&
                      !selectedRecommendPlatform)
                  }
                >
                  {enviando ? "Enviando..." : "Recomendar"}
                </button>
                {errorEnvio && (
                  <div style={{ color: "red", marginTop: 8 }}>{errorEnvio}</div>
                )}
                {!user && (
                  <div style={{ color: "orange", marginTop: 8 }}>
                    Debes iniciar sesion para recomendar.
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}
      <div className="top-section" style={{ marginTop: 8 }}>
        <h2>{title}</h2>
        <div
          className="top-section-h2-down"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span>
            <b>{filteredData.length}</b> entrada
            {filteredData.length === 1 ? "" : "s"}
          </span>
          <button
            aria-label={isGrid ? "Vista lista" : "Vista grid"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => setIsGrid((v) => !v)}
          >
            {isGrid ? (
              <TablerLayoutGridFilled
                style={{ fontSize: 20, color: "var(--text-2)" }}
              />
            ) : (
              <MaterialSymbolsListsRounded
                style={{ fontSize: 20, color: "var(--text-2)" }}
              />
            )}
          </button>
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
          {filteredData.length > 0 ? (
            isGrid ? (
              <div className={gridClass}>
                {filteredData.map((row, idx) => (
                  <ItemCaratula
                    key={idx}
                    {...row}
                    userSheet={getUserById(row.Usuario)}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {filteredData.map((row, idx) => (
                  <ItemImagenList
                    key={idx}
                    {...row}
                    userSheet={getUserById(row.Usuario)}
                  />
                ))}
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", padding: 32 }}>
              No hay recomendaciones
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default Recomendar;

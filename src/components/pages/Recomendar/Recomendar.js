import React, { useMemo, useState, useEffect } from "react";
import "./Recomendar.css";
import ItemCaratula, {
	fetchVotes,
} from "../../common/ItemCaratula/ItemCaratula";
import ItemImagenList from "../../common/ItemImagenList/ItemImagenList";
import { MaterialSymbolsListsRounded } from "../../icons/MaterialSymbolsListsRounded";
import { TablerLayoutGridFilled } from "../../icons/TablerLayoutGridFilled";
import ItemImagenSmall from "../../common/ItemImagenSmall/ItemImagenSmall";
import SearchBar from "../../common/SearchBar/SearchBar";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";
import { useSheetConfig } from "../../../hooks/useSheetConfig";
import { useAuth } from "../../../hooks/useAuth";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { useLocation } from "react-router-dom";
import { API_URLS } from "../../../constants/config";

const getRowId = (row) => row?.ID ?? row?.Id ?? row?.id ?? "";

function Recomendar() {
	const { config } = useSheetConfig();
	const handleSearchBarClick = () => {
		if (successMsg) setSuccessMsg("");
	};
	const location = useLocation();
	const isJuegos = location.pathname.includes("/juegos");
	const SHEET_URL = isJuegos
		? config?.juegosSheetUrl || ""
		: config?.pelisSheetUrl || "";

	const CACHE_KEY = React.useMemo(
		() => `gsheet_cache_${SHEET_URL}_default`,
		[SHEET_URL],
	);

	const { data, loading, error } = useGoogleSheet(SHEET_URL);
	const { data: usersData } = useGoogleSheet(
		config?.userdataSheetUrl || "",
		"userData",
	);

	const [localCacheData, setLocalCacheData] = useState([]);
	const [removedIds, setRemovedIds] = useState(() => new Set());

	useEffect(() => {
		if (!CACHE_KEY) return;
		try {
			const stored = window.localStorage.getItem(CACHE_KEY);
			if (stored) {
				setLocalCacheData(JSON.parse(stored));
			} else {
				setLocalCacheData([]);
			}
		} catch {
			setLocalCacheData([]);
		}
	}, [CACHE_KEY]);

	useEffect(() => {
		setRemovedIds(new Set());
	}, [CACHE_KEY]);

	const formatDateDDMMYYYY = React.useCallback((date = new Date()) => {
		const d = date.getDate().toString().padStart(2, "0");
		const m = (date.getMonth() + 1).toString().padStart(2, "0");
		const y = date.getFullYear();
		return `${d}/${m}/${y}`;
	}, []);

	const addRecommendationToLocalCache = React.useCallback(
		(recommendation) => {
			if (!CACHE_KEY) return;
			try {
				const stored = window.localStorage.getItem(CACHE_KEY);
				const existing = stored ? JSON.parse(stored) : [];
				const updated = Array.isArray(existing)
					? [...existing, recommendation]
					: [recommendation];
				window.localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
				setLocalCacheData(updated);
			} catch {}
		},
		[CACHE_KEY],
	);
	const removeRecommendationFromLocalCache = (id) => {
		if (!CACHE_KEY) return;
		const normalizedId = String(id).trim();
		try {
			const stored = window.localStorage.getItem(CACHE_KEY);
			if (!stored) return;
			const parsed = JSON.parse(stored);
			if (!Array.isArray(parsed)) return;
			const filtered = parsed.filter((row) => {
				const rowId = String(getRowId(row)).trim();
				return rowId !== normalizedId;
			});
			window.localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
			setLocalCacheData(filtered);
			setRemovedIds((prev) => {
				const next = new Set(prev);
				next.add(normalizedId);
				return next;
			});
		} catch {}
	};

	const { isAdmin } = useAuth();
	const [user] = useLocalStorage("twitchUser", null);
	const [token] = useLocalStorage("twitchToken", null);

	const buildRecommendationForCache = React.useCallback(
		(selectedResult, tipoValue, comentario) => {
			const now = new Date();
			return {
				ID:
					selectedResult.id ||
					selectedResult.ID ||
					selectedResult.Id ||
					"",
				Nombre:
					selectedResult.nombre ||
					selectedResult.title ||
					selectedResult.name ||
					"",
				Estado: "Recomendacion",
				Tipo: tipoValue || "",
				Fecha: formatDateDDMMYYYY(now),
				URL: "",
				Caratula:
					selectedResult.caratula || selectedResult.Caratula || "",
				Imagen: selectedResult.imagen || selectedResult.Imagen || "",
				Duracion:
					selectedResult.duracion || selectedResult.Duracion || "",
				Nota: "",
				Trailer: selectedResult.trailer || selectedResult.Trailer || "",
				Generos: Array.isArray(selectedResult.generos)
					? selectedResult.generos.join(", ")
					: selectedResult.generos || "",
				Resumen: selectedResult.resumen || selectedResult.Resumen || "",
				Fecha_Salida:
					selectedResult.fecha ||
					selectedResult.Fecha_Salida ||
					selectedResult.FechaSalida ||
					"",
				Nota_Global:
					selectedResult.nota_global ||
					selectedResult.Nota_Global ||
					"",
				Creador: selectedResult.creador || selectedResult.Creador || "",
				Usuario:
					user?.id ||
					user?.user_id ||
					user?.userId ||
					user?.id_str ||
					"",
				Comentario: comentario || "",
			};
		},
		[formatDateDDMMYYYY, user],
	);

	const parseDateValue = (val) => {
		if (!val) return 0;

		if (typeof val === "string") {
			const parts = val.split("/");
			if (parts.length === 3) {
				const [d, m, y] = parts;
				const iso = `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
				const time = Date.parse(iso);
				return isNaN(time) ? 0 : time;
			}

			const parsed = Date.parse(val);
			return isNaN(parsed) ? 0 : parsed;
		}

		if (typeof val === "number") {
			return val;
		}
		return 0;
	};

	const [voteCounts, setVoteCounts] = useState(new Map());

	const mapsAreEqual = React.useCallback((a, b) => {
		if (a === b) return true;
		if (!a || !b) return false;
		if (a.size !== b.size) return false;
		for (const [key, value] of a) {
			if (b.get(key) !== value) return false;
		}
		return true;
	}, []);

	const setVoteCountsIfChanged = React.useCallback(
		(next) => {
			setVoteCounts((prev) => {
				if (mapsAreEqual(prev, next)) return prev;
				return next;
			});
		},
		[mapsAreEqual],
	);

	useEffect(() => {
		if (!data) return;
		const tipo = isJuegos ? "Juegos" : "Pelis";
		const cacheKey = `gsheet_cache_votes_${tipo}`;
		try {
			const stored = window.localStorage.getItem(cacheKey);
			if (stored) {
				const parsed = JSON.parse(stored);
				let votes = [];
				if (Array.isArray(parsed)) {
					votes = parsed;
				} else if (parsed && typeof parsed === "object") {
					votes = Object.entries(parsed).flatMap(([id, count]) =>
						Array.from({ length: Number(count) || 0 }, () => ({
							ID: id,
						})),
					);
				}
				const map = new Map();
				for (const vote of votes) {
					const id = String(
						vote?.ID ?? vote?.Id ?? vote?.id ?? "",
					).trim();
					if (!id) continue;
					map.set(id, (map.get(id) || 0) + 1);
				}
				setVoteCounts(map);
			}
		} catch {}
	}, [data, isJuegos]);

	const handleVoteChange = (id, newCount) => {
		setVoteCounts((prev) => {
			const m = new Map(prev);
			m.set(id, newCount);
			return m;
		});
	};

	useEffect(() => {
		if (!data) return;

		const tipo = isJuegos ? "Juegos" : "Pelis";
		let cancelled = false;

		const loadVotes = async () => {
			try {
				const { counts } = await fetchVotes(tipo);
				if (!cancelled && counts) setVoteCountsIfChanged(counts);

				const { counts: updatedCounts } = await fetchVotes(tipo, null, {
					skipCache: true,
				});
				if (!cancelled && updatedCounts)
					setVoteCountsIfChanged(updatedCounts);
			} catch {}
		};

		loadVotes();
		return () => {
			cancelled = true;
		};
	}, [data, isJuegos, setVoteCountsIfChanged]);

	const filteredData = useMemo(() => {
		if (!data && (!localCacheData || localCacheData.length === 0))
			return [];

		// Prefer the most recent local cache entries when there are duplicates.
		const merged = [...(data || []), ...(localCacheData || [])];
		const uniqueById = new Map();
		for (const row of merged) {
			const id = String(getRowId(row)).trim();
			if (!id) continue;
			// Always overwrite so local cache entries (later in the list) win.
			uniqueById.set(id, row);
		}
		const items = Array.from(uniqueById.values())
			.filter(
				(row) =>
					(row["Estado"] || "").toLowerCase() === "recomendacion",
			)
			.filter((row) => {
				const id = String(getRowId(row)).trim();
				return !removedIds.has(id);
			});

		items.sort((a, b) => {
			const idA = String(getRowId(a));
			const idB = String(getRowId(b));
			const votesA = voteCounts.get(idA) || 0;
			const votesB = voteCounts.get(idB) || 0;
			if (votesB !== votesA) return votesB - votesA;
			const da = parseDateValue(a.Fecha || a.recommendedDate);
			const db = parseDateValue(b.Fecha || b.recommendedDate);
			return da - db;
		});
		return items;
	}, [data, voteCounts, localCacheData, removedIds]);

	const getUserById = (id) => {
		if (!usersData || !id) {
			return null;
		}
		const found = usersData.find(
			(u) => String(u.id).trim() === String(id).trim(),
		);
		return found;
	};

	const title = isJuegos
		? "Juegos Recomendados"
		: "Peliculas o Series Recomendadas";
	const titleRecomendar = isJuegos
		? "Recomendar Juego"
		: "Recomendar Pelicula o Serie";

	const [isGrid, setIsGrid] = useLocalStorage(
		isJuegos ? "recomendar_juegos_isGrid" : "recomendar_pelis_isGrid",
		true,
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

	const existingMatch = useMemo(() => {
		if (!selectedResult || !data || data.length === 0) return null;

		const selectedId = String(selectedResult.id || "").trim();

		return (
			data.find((row) => {
				const rowId = String(getRowId(row) || "").trim();
				return selectedId && rowId && selectedId === rowId;
			}) || null
		);
	}, [data, selectedResult]);

	const [comentario, setComentario] = useState("");

	const [selectedRecommendPlatform, setSelectedRecommendPlatform] =
		useState("");

	const [enviando, setEnviando] = useState(false);
	const [, setEnviado] = useState(false);
	const [errorEnvio, setErrorEnvio] = useState("");

	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState("");
	const latestRecommendationRef = React.useRef(null);

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
					let url = isJuegos
						? API_URLS.IGDB_SEARCH
						: API_URLS.TMDB_SEARCH;
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
								caratula: fixUrl(
									item.caratula || item.cover?.url,
								),
								imagen: fixUrl(item.imagen),
								fecha:
									item.fecha ||
									(item.first_release_date
										? new Date(
												item.first_release_date * 1000,
											).getFullYear()
										: undefined),
								generos:
									item.generos ||
									item.genres?.map((g) => g.name) ||
									[],
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
												item.poster_path ||
												item.backdrop_path
											}`
										: undefined),
								fecha:
									item.fecha ||
									item.release_date ||
									item.first_air_date,
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

	useEffect(() => {
		if (
			successMsg === "¡Recomendacion enviada! Muchas gracias" &&
			latestRecommendationRef.current
		) {
			addRecommendationToLocalCache(
				buildRecommendationForCache(
					latestRecommendationRef.current.selectedResult,
					latestRecommendationRef.current.tipoValue,
					latestRecommendationRef.current.comentario,
				),
			);
			latestRecommendationRef.current = null;
		}
	}, [
		successMsg,
		addRecommendationToLocalCache,
		buildRecommendationForCache,
	]);

	return (
		<main className="main-container">
			{user && (
				<div
					className="top-section"
					style={{ marginTop: 8, marginBottom: 0 }}
				>
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
							style={{
								marginTop: 15,
								color: "var(--text-2)",
								fontSize: 14,
							}}
						>
							Buscando...
						</div>
					)}
					{successMsg && !searchLoading && (
						<div
							style={{
								marginTop: 15,
								color: "green",
								fontSize: 14,
							}}
						>
							{successMsg}
						</div>
					)}
					{searchError && (
						<div
							style={{
								marginTop: 8,
								color: "var(--error)",
								fontSize: 14,
							}}
						>
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
											selectedResult &&
											selectedResult.id === result.id
												? " autocomplete-item-selected"
												: ""
										}`}
										onClick={() =>
											setSelectedResult(result)
										}
									>
										<ItemImagenSmall
											Imagen={
												result.imagen ||
												result.caratula ||
												result.Caratula
											}
											Nombre={
												result.nombre ||
												result.title ||
												result.name
											}
											Resumen={
												result.resumen ||
												result.overview
											}
											Trailer={result.trailer}
											Generos={
												Array.isArray(result.generos)
													? result.generos.join(", ")
													: result.generos
											}
											Fecha_Salida={
												result.fecha ||
												result.fecha_salida
											}
											Tipo={result.tipo || result.Tipo}
											Creador={
												result.creador || result.Creador
											}
											Nota_Global={
												result.nota_global ||
												result.Nota_Global
											}
											Caratula={
												result.caratula ||
												result.Caratula
											}
											Duracion={
												result.duracion ||
												result.Duracion
											}
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
								!existingMatch &&
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
												setSelectedRecommendPlatform(
													e.target.value,
												)
											}
										>
											<option value="">
												Selecciona una plataforma...
											</option>
											{selectedResult.tipo.map(
												(platform, idx) => (
													<option
														key={platform + idx}
														value={platform}
													>
														{platform}
													</option>
												),
											)}
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
										const cleanResult = {
											...selectedResult,
										};
										if (cleanResult.tipo)
											delete cleanResult.tipo;
										if (
											cleanResult.raw &&
											cleanResult.raw.tipo
										)
											delete cleanResult.raw.tipo;

										let tipoValue;
										if (isJuegos) {
											tipoValue =
												selectedRecommendPlatform ||
												(Array.isArray(
													selectedResult.tipo,
												)
													? selectedResult.tipo[0]
													: "");
										} else {
											tipoValue =
												selectedResult.raw?.tipo ||
												selectedResult.tipo ||
												"";
										}

										const res = await fetch(
											"/api/add-recommendation",
											{
												method: "POST",
												headers: {
													"Content-Type":
														"application/json",
													...(token
														? {
																Authorization: `Bearer ${token}`,
															}
														: {}),
												},
												body: JSON.stringify({
													item: {
														...cleanResult,
														tipo: tipoValue,
													},
													comment: comentario,
												}),
											},
										);
										const data = await res.json();
										if (!res.ok || !data.success)
											throw new Error(
												data.error || "Error al enviar",
											);
										latestRecommendationRef.current = {
											selectedResult,
											tipoValue,
											comentario,
										};
										setEnviado(true);
										setComentario("");
										setSelectedResult(null);
										setSelectedRecommendPlatform("");
										setSearch("");
										setSearchResults([]);
										setSuccessMsg(
											"¡Recomendacion enviada! Muchas gracias",
										);
									} catch (err) {
										setErrorEnvio(err.message);
									} finally {
										setEnviando(false);
									}
								}}
							>
								{existingMatch && !isAdmin ? (
									<>
										<div className="recomendar-duplicate-message">
											{isJuegos
												? "Este juego ya ha sido recomendado o jugado..."
												: "Esta pelicula o serie ya ha sido recomendada o vista..."}
										</div>
										<div className="inset-section">
											<ItemImagenList
												{...existingMatch}
												userSheet={getUserById(
													existingMatch.Usuario,
												)}
											/>
										</div>
									</>
								) : (
									<>
										{existingMatch && isAdmin && (
											<div className="recomendar-duplicate-message">
												{isJuegos
													? "Este juego ya ha sido recomendado o jugado..."
													: "Esta pelicula o serie ya ha sido recomendada o vista..."}
											</div>
										)}
										<div className="char-counter">
											{100 - comentario.length} caracteres
											restantes
										</div>
										<textarea
											placeholder="¿Algo que comentar sobre la recomendacion? (opcional)"
											value={comentario}
											onChange={(e) =>
												setComentario(e.target.value)
											}
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
													Array.isArray(
														selectedResult.tipo,
													) &&
													selectedResult.tipo.length >
														0 &&
													!selectedRecommendPlatform)
											}
										>
											{enviando
												? "Enviando..."
												: "Recomendar"}
										</button>
									</>
								)}
								{errorEnvio && (
									<div style={{ color: "red", marginTop: 8 }}>
										{errorEnvio}
									</div>
								)}
								{!user && (
									<div
										style={{
											color: "orange",
											marginTop: 8,
										}}
									>
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
				<div style={{ textAlign: "center", margin: "2em 0" }}>
					Cargando...
				</div>
			) : error ? (
				<div
					style={{
						color: "red",
						textAlign: "center",
						margin: "2em 0",
					}}
				>
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
										onVote={handleVoteChange}
										onRecommendationDeleted={
											removeRecommendationFromLocalCache
										}
									/>
								))}
							</div>
						) : (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 16,
								}}
							>
								{filteredData.map((row, idx) => (
									<ItemImagenList
										key={idx}
										{...row}
										userSheet={getUserById(row.Usuario)}
										onRecommendationDeleted={
											removeRecommendationFromLocalCache
										}
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

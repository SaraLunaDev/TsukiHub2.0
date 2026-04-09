import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { STORAGE_KEYS, API_URLS } from "../../../constants/config";
import SearchBar from "../../common/SearchBar/SearchBar";
import ItemImagenSmall from "../../common/ItemImagenSmall/ItemImagenSmall";
import "../EditarItem/EditarItem.css";
import "../Recomendar/Recomendar.css";
import "./AnadirItem.css";

export default function AnadirItem() {
	const navigate = useNavigate();
	const location = useLocation();
	const isJuegos = location.pathname.includes("/juegos");
	const { isAdmin, user } = useAuth();
	const [token] = useLocalStorage(STORAGE_KEYS.TWITCH_TOKEN, null);

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	const [search, setSearch] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState("");
	const [selectedResult, setSelectedResult] = useState(null);

	const [itemData, setItemData] = useState({
		tipo: isJuegos ? "Juego" : "Pelicula",
		estado: "Planeo",
	});

	useEffect(() => {
		if (user && !isAdmin) {
			navigate("/");
		}
	}, [user, isAdmin, navigate]);

	useEffect(() => {
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
					const url = isJuegos
						? API_URLS.IGDB_SEARCH
						: API_URLS.TMDB_SEARCH;
					const body = isJuegos
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
						const fixUrl = (u) => {
							if (!u) return undefined;
							if (u.startsWith("http")) return u;
							if (u.startsWith("//")) return "https:" + u;
							return u;
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
										? `https://image.tmdb.org/t/p/w185${item.poster_path || item.backdrop_path}`
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

	const handleSelectResult = (result) => {
		setSelectedResult(result);
		setSearch("");
		setSearchResults([]);

		const tipoValue = isJuegos
			? Array.isArray(result.tipo)
				? result.tipo[0] || ""
				: result.tipo || ""
			: result.raw?.tipo || result.tipo || "";

		setItemData({
			tipo: isJuegos ? "Juego" : "Pelicula",
			id: result.id || "",
			nombre: result.nombre || result.title || result.name || "",
			estado: "Planeo",
			plataforma: tipoValue,
			fecha: "",
			duracion: result.duracion || "",
			nota: "",
			youtube_url: "",
			caratula: result.caratula || "",
			imagen: result.imagen || "",
			trailer: result.trailer || "",
			generos: Array.isArray(result.generos)
				? result.generos.join(", ")
				: result.generos || "",
			resumen: result.resumen || "",
			fecha_salida: String(
				result.fecha || result.raw?.fecha_salida || "",
			),
			nota_global: result.nota_global || "",
			creador: result.creador || "",
			usuario_id: "",
			comentario: "",
		});
	};

	const handleInputChange = (field, value) => {
		setItemData((prev) => ({ ...prev, [field]: value }));
	};

	const setTodayFecha = () => {
		const now = new Date();
		const dd = String(now.getDate()).padStart(2, "0");
		const mm = String(now.getMonth() + 1).padStart(2, "0");
		const yyyy = now.getFullYear();
		handleInputChange("fecha", `${dd}/${mm}/${yyyy}`);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError("");
		setSuccessMsg("");

		try {
			const response = await fetch("/api/add-item", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ itemData }),
			});

			if (!response.ok) {
				throw new Error(
					`Error ${response.status}: ${response.statusText}`,
				);
			}

			const result = await response.json();
			if (result.success) {
				setSuccessMsg("¡Item añadido correctamente!");
				setSelectedResult(null);
				setItemData({
					tipo: isJuegos ? "Juego" : "Pelicula",
					estado: "Planeo",
				});
			} else {
				throw new Error(result.error || "Failed to add item");
			}
		} catch (err) {
			setError("Error al añadir: " + err.message);
		} finally {
			setSaving(false);
		}
	};

	if (!user || !isAdmin) {
		return <div>Acceso denegado</div>;
	}

	return (
		<div className="main-container">
			<div className="top-section editar-header">
				<div className="header-title-ellipsis">
					<span className="header-title-text">
						{isJuegos ? "Añadir Juego" : "Añadir Pelicula/Serie"}
					</span>
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="btn-back"
					>
						← Volver
					</button>
				</div>
			</div>

			{error && <div className="error-message">Error: {error}</div>}
			{successMsg && (
				<div className="anadir-success-message">{successMsg}</div>
			)}

			<div className="inset-section recomendar-section">
				<SearchBar
					placeholder={
						isJuegos
							? "Buscar juego para añadir..."
							: "Buscar pelicula o serie para añadir..."
					}
					value={search}
					onChange={setSearch}
					className="recomendar-searchbar"
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
									className={`autocomplete-item${idx !== searchResults.length - 1 ? " autocomplete-item-border" : ""}${selectedResult && selectedResult.id === result.id ? " autocomplete-item-selected" : ""}`}
									onClick={() => handleSelectResult(result)}
								>
									<ItemImagenSmall
										Imagen={
											result.imagen || result.caratula
										}
										Nombre={
											result.nombre ||
											result.title ||
											result.name
										}
										Resumen={
											result.resumen || result.overview
										}
										Trailer={result.trailer}
										Generos={
											Array.isArray(result.generos)
												? result.generos.join(", ")
												: result.generos
										}
										Fecha_Salida={
											result.fecha || result.fecha_salida
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
											result.caratula || result.Caratula
										}
										Duracion={
											result.duracion || result.Duracion
										}
									/>
								</div>
							))}
						</div>
					)}
			</div>

			{selectedResult && (
				<div className="inset-section">
					<form onSubmit={handleSave} className="edit-form">
						<div className="edit-layout">
							<div className="form-grid">
								<div className="form-fields-grid">
									<div className="form-group">
										<label>Nombre</label>
										<input
											type="text"
											value={itemData.nombre || ""}
											onChange={(e) =>
												handleInputChange(
													"nombre",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="form-group">
										<label>Estado</label>
										<select
											value={itemData.estado || ""}
											onChange={(e) =>
												handleInputChange(
													"estado",
													e.target.value,
												)
											}
										>
											<option value="">
												Seleccionar...
											</option>
											<option value="Ahora">Ahora</option>
											<option value="Planeo">
												Planeo
											</option>
											<option value="Pasado">
												Pasado
											</option>
											<option value="Dropeado">
												Dropeado
											</option>
											<option value="Recomendacion">
												Recomendación
											</option>
											<option value="Pausado">
												Pausado
											</option>
										</select>
									</div>
									<div className="form-group">
										<label>Tipo</label>
										<input
											type="text"
											value={itemData.plataforma || ""}
											onChange={(e) =>
												handleInputChange(
													"plataforma",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="form-group">
										<label>Nota</label>
										<div className="slider-container">
											<input
												type="range"
												min="0"
												max="10"
												step="0.25"
												value={itemData.nota || 0}
												onChange={(e) =>
													handleInputChange(
														"nota",
														e.target.value,
													)
												}
											/>
											<span className="slider-value">
												{itemData.nota || 0}
											</span>
										</div>
									</div>
									<div className="form-group">
										<label>URL</label>
										<input
											type="url"
											value={itemData.youtube_url || ""}
											onChange={(e) =>
												handleInputChange(
													"youtube_url",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="form-group">
										<label>Duración</label>
										<input
											type="text"
											value={itemData.duracion || ""}
											onChange={(e) =>
												handleInputChange(
													"duracion",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="form-group fecha-group">
										<label>Fecha</label>
										<div className="fecha-input-wrapper">
											<input
												type="text"
												value={itemData.fecha || ""}
												onChange={(e) =>
													handleInputChange(
														"fecha",
														e.target.value,
													)
												}
											/>
											<button
												type="button"
												onClick={setTodayFecha}
											>
												Hoy
											</button>
										</div>
									</div>
									<div className="form-group">
										<label>Fecha Salida</label>
										<input
											type="text"
											value={itemData.fecha_salida || ""}
											onChange={(e) =>
												handleInputChange(
													"fecha_salida",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="form-group">
										<label>Trailer</label>
										<input
											type="url"
											value={itemData.trailer || ""}
											onChange={(e) =>
												handleInputChange(
													"trailer",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="form-group">
										<label>Nota Global</label>
										<div className="slider-container">
											<input
												type="range"
												min="0"
												max="10"
												step="0.001"
												value={
													itemData.nota_global || 0
												}
												onChange={(e) =>
													handleInputChange(
														"nota_global",
														e.target.value,
													)
												}
											/>
											<span className="slider-value">
												{itemData.nota_global || 0}
											</span>
										</div>
									</div>
									<div className="form-group">
										<label>Creador</label>
										<input
											type="text"
											value={itemData.creador || ""}
											onChange={(e) =>
												handleInputChange(
													"creador",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="form-group">
										<label>Usuario</label>
										<input
											type="text"
											value={itemData.usuario_id || ""}
											onChange={(e) =>
												handleInputChange(
													"usuario_id",
													e.target.value,
												)
											}
										/>
									</div>
								</div>
								<div className="form-group form-group-full">
									<label>Géneros</label>
									<input
										type="text"
										value={itemData.generos || ""}
										onChange={(e) =>
											handleInputChange(
												"generos",
												e.target.value,
											)
										}
										placeholder="Separados por comas"
									/>
								</div>
								<div className="form-group form-group-full resumen-field">
									<label>Resumen</label>
									<textarea
										value={itemData.resumen || ""}
										onChange={(e) =>
											handleInputChange(
												"resumen",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group form-group-full comentario-field">
									<label>Comentario</label>
									<textarea
										value={itemData.comentario || ""}
										onChange={(e) =>
											handleInputChange(
												"comentario",
												e.target.value,
											)
										}
										rows={2}
									/>
								</div>
							</div>
							<div className="images-sidebar">
								<div className="form-group">
									<label>Carátula</label>
									{itemData.caratula && (
										<div className="image-preview">
											<img
												src={itemData.caratula}
												alt="Previsualización carátula"
												onError={(e) => {
													e.target.style.display =
														"none";
												}}
												onLoad={(e) => {
													e.target.style.display =
														"block";
												}}
											/>
										</div>
									)}
									<input
										type="url"
										value={itemData.caratula || ""}
										onChange={(e) =>
											handleInputChange(
												"caratula",
												e.target.value,
											)
										}
										placeholder="URL de la carátula"
									/>
								</div>
								<div className="form-group">
									<label>Imagen</label>
									{itemData.imagen && (
										<div className="image-preview">
											<img
												src={itemData.imagen}
												alt="Previsualización imagen"
												onError={(e) => {
													e.target.style.display =
														"none";
												}}
												onLoad={(e) => {
													e.target.style.display =
														"block";
												}}
											/>
										</div>
									)}
									<input
										type="url"
										value={itemData.imagen || ""}
										onChange={(e) =>
											handleInputChange(
												"imagen",
												e.target.value,
											)
										}
										placeholder="URL de la imagen"
									/>
								</div>
							</div>
						</div>
						<div className="form-actions">
							<button
								type="button"
								onClick={() => {
									setSelectedResult(null);
									setItemData({
										tipo: isJuegos ? "Juego" : "Pelicula",
										estado: "Planeo",
									});
								}}
								disabled={saving}
								className="btn-cancel"
							>
								Limpiar
							</button>
							<button
								type="submit"
								disabled={saving}
								className="btn-save"
							>
								{saving ? "Añadiendo..." : "Añadir"}
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

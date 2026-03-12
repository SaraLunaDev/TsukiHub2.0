import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../../constants/config";
import "./EditarItem.css";

export default function EditarItem() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const fecha = searchParams.get("fecha");
	const navigate = useNavigate();
	const { isAdmin, user } = useAuth();
	const [token] = useLocalStorage(STORAGE_KEYS.TWITCH_TOKEN, null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [itemData, setItemData] = useState({});

	useEffect(() => {
		if (user && !isAdmin) {
			navigate("/");
			return;
		}
	}, [user, isAdmin, navigate]);

	useEffect(() => {
		if (!id || !user || !isAdmin) return;

		const loadItemData = async () => {
			try {
				setLoading(true);

				const response = await fetch(
					`/api/get-item?id=${id}&fecha=${encodeURIComponent(fecha || "")}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);

				if (!response.ok) {
					throw new Error(
						`Error ${response.status}: ${response.statusText}`,
					);
				}

				const result = await response.json();
				if (result.success) {
					setItemData(result.data);
				} else {
					throw new Error(result.error || "Failed to load item data");
				}
			} catch (error) {
				console.error("Error loading item:", error);
				setError(
					"Error al cargar los datos del item: " + error.message,
				);
			} finally {
				setLoading(false);
			}
		};

		loadItemData();
	}, [id, user, isAdmin, token, fecha]);

	const handleInputChange = (field, value) => {
		setItemData((prev) => ({ ...prev, [field]: value }));
	};

	const setTodayFecha = () => {
		const now = new Date();
		const dd = String(now.getDate()).padStart(2, "0");
		const mm = String(now.getMonth() + 1).padStart(2, "0");
		const yyyy = now.getFullYear();
		const formatted = `${dd}/${mm}/${yyyy}`;
		handleInputChange("Fecha", formatted);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError("");

		try {
			const response = await fetch("/api/update-item", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					id: itemData.ID,
					fecha: fecha,
					itemData: itemData,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Error ${response.status}: ${response.statusText}`,
				);
			}

			const result = await response.json();
			if (result.success) {
				navigate(-1);
			} else {
				throw new Error(result.error || "Failed to save item");
			}
		} catch (error) {
			console.error("Error saving item:", error);
			setError("Error al guardar: " + error.message);
		} finally {
			setSaving(false);
		}
	};

	if (!user || !isAdmin) {
		return <div>Acceso denegado</div>;
	}

	if (loading) {
		return <div className="main-container">Cargando...</div>;
	}

	return (
		<div className="main-container">
			<div className="top-section editar-header">
				<div className="header-title-ellipsis">
					<span className="header-title-text">
						{itemData.Nombre || `Item #${id}`} ({id})
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

			<div className="inset-section">
				<form onSubmit={handleSave} className="edit-form">
					<div className="edit-layout">
						<div className="form-grid">
							<div className="form-fields-grid">
								<div className="form-group">
									<label>Nombre</label>
									<input
										type="text"
										value={itemData.Nombre || ""}
										onChange={(e) =>
											handleInputChange(
												"Nombre",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Estado</label>
									<select
										value={itemData.Estado || ""}
										onChange={(e) =>
											handleInputChange(
												"Estado",
												e.target.value,
											)
										}
									>
										<option value="">Seleccionar...</option>
										<option value="Ahora">Ahora</option>
										<option value="Planeado">
											Planeado
										</option>
										<option value="Pasado">Pasado</option>
										<option value="Dropeado">
											Dropeado
										</option>
										<option value="Recomendacion">
											Recomendación
										</option>
										<option value="Pausado">Pausado</option>
									</select>
								</div>
								<div className="form-group">
									<label>Tipo</label>
									<input
										type="text"
										value={itemData.Tipo || ""}
										onChange={(e) =>
											handleInputChange(
												"Tipo",
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
											value={itemData.Nota || 0}
											onChange={(e) =>
												handleInputChange(
													"Nota",
													e.target.value,
												)
											}
										/>
										<span className="slider-value">
											{itemData.Nota || 0}
										</span>
									</div>
								</div>
								<div className="form-group">
									<label>URL</label>
									<input
										type="url"
										value={
											itemData.Link || itemData.URL || ""
										}
										onChange={(e) =>
											handleInputChange(
												"Link",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Duración</label>
									<input
										type="text"
										value={itemData.Duracion || ""}
										onChange={(e) =>
											handleInputChange(
												"Duracion",
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
											value={itemData.Fecha || ""}
											onChange={(e) =>
												handleInputChange(
													"Fecha",
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
										value={itemData.Fecha_Salida || ""}
										onChange={(e) =>
											handleInputChange(
												"Fecha_Salida",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Trailer</label>
									<input
										type="url"
										value={itemData.Trailer || ""}
										onChange={(e) =>
											handleInputChange(
												"Trailer",
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
											value={itemData.Nota_Global || 0}
											onChange={(e) =>
												handleInputChange(
													"Nota_Global",
													e.target.value,
												)
											}
										/>
										<span className="slider-value">
											{itemData.Nota_Global || 0}
										</span>
									</div>
								</div>
								<div className="form-group">
									<label>Creador</label>
									<input
										type="text"
										value={itemData.Creador || ""}
										onChange={(e) =>
											handleInputChange(
												"Creador",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="form-group">
									<label>Usuario</label>
									<input
										type="text"
										value={itemData.Usuario || ""}
										onChange={(e) =>
											handleInputChange(
												"Usuario",
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
									value={itemData.Generos || ""}
									onChange={(e) =>
										handleInputChange(
											"Generos",
											e.target.value,
										)
									}
									placeholder="Separados por comas"
								/>
							</div>
							<div className="form-group form-group-full resumen-field">
								<label>Resumen</label>
								<textarea
									value={itemData.Resumen || ""}
									onChange={(e) =>
										handleInputChange(
											"Resumen",
											e.target.value,
										)
									}
								/>
							</div>
							<div className="form-group form-group-full comentario-field">
								<label>Comentario</label>
								<textarea
									value={itemData.Comentario || ""}
									onChange={(e) =>
										handleInputChange(
											"Comentario",
											e.target.value,
										)
									}
									rows={2}
								/>
							</div>{" "}
						</div>
						<div className="images-sidebar">
							<div className="form-group">
								<label>Carátula</label>
								{itemData.Caratula && (
									<div className="image-preview">
										<img
											src={itemData.Caratula}
											alt="Previsualización carátula"
											onError={(e) => {
												e.target.style.display = "none";
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
									value={itemData.Caratula || ""}
									onChange={(e) =>
										handleInputChange(
											"Caratula",
											e.target.value,
										)
									}
									placeholder="URL de la carátula"
								/>
							</div>

							<div className="form-group">
								<label>Imagen</label>
								{itemData.Imagen && (
									<div className="image-preview">
										<img
											src={itemData.Imagen}
											alt="Previsualización imagen"
											onError={(e) => {
												e.target.style.display = "none";
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
									value={itemData.Imagen || ""}
									onChange={(e) =>
										handleInputChange(
											"Imagen",
											e.target.value,
										)
									}
									placeholder="URL de la imagen"
								/>
							</div>
						</div>{" "}
					</div>

					<div className="form-actions">
						<button
							type="button"
							onClick={() => navigate(-1)}
							disabled={saving}
							className="btn-cancel"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={saving}
							className="btn-save"
						>
							{saving ? "Guardando..." : "Guardar"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

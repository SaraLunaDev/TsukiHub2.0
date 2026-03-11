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
			<div className="top-section">
				<h2>Editar Item #{id}</h2>
				<div className="top-section-h2-down">
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
					<div className="form-grid">
						<div className="form-group">
							<label>ID</label>
							<input
								type="text"
								value={itemData.ID || ""}
								onChange={(e) =>
									handleInputChange("ID", e.target.value)
								}
								disabled
							/>
						</div>

						<div className="form-group">
							<label>Nombre</label>
							<input
								type="text"
								value={itemData.Nombre || ""}
								onChange={(e) =>
									handleInputChange("Nombre", e.target.value)
								}
							/>
						</div>

						<div className="form-group">
							<label>Estado</label>
							<select
								value={itemData.Estado || ""}
								onChange={(e) =>
									handleInputChange("Estado", e.target.value)
								}
							>
								<option value="">Seleccionar...</option>
								<option value="Ahora">Ahora</option>
								<option value="Planeado">Planeado</option>
								<option value="Pasado">Pasado</option>
								<option value="Dropeado">Dropeado</option>
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
									handleInputChange("Tipo", e.target.value)
								}
							/>
						</div>

						<div className="form-group">
							<label>Nota</label>
							<input
								type="number"
								min="0"
								max="10"
								step="0.1"
								value={itemData.Nota || ""}
								onChange={(e) =>
									handleInputChange("Nota", e.target.value)
								}
							/>
						</div>

						<div className="form-group">
							<label>URL</label>
							<input
								type="url"
								value={itemData.Link || itemData.URL || ""}
								onChange={(e) =>
									handleInputChange("Link", e.target.value)
								}
							/>
						</div>

						<div className="form-group">
							<label>Carátula</label>
							<input
								type="url"
								value={itemData.Caratula || ""}
								onChange={(e) =>
									handleInputChange(
										"Caratula",
										e.target.value,
									)
								}
							/>
						</div>

						<div className="form-group">
							<label>Imagen</label>
							<input
								type="url"
								value={itemData.Imagen || ""}
								onChange={(e) =>
									handleInputChange("Imagen", e.target.value)
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

						<div className="form-group">
							<label>Fecha</label>
							<input
								type="text"
								value={itemData.Fecha || ""}
								onChange={(e) =>
									handleInputChange("Fecha", e.target.value)
								}
							/>
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
									handleInputChange("Trailer", e.target.value)
								}
							/>
						</div>

						<div className="form-group">
							<label>Nota Global</label>
							<input
								type="number"
								min="0"
								max="10"
								step="0.1"
								value={itemData.Nota_Global || ""}
								onChange={(e) =>
									handleInputChange(
										"Nota_Global",
										e.target.value,
									)
								}
							/>
						</div>

						<div className="form-group">
							<label>Creador</label>
							<input
								type="text"
								value={itemData.Creador || ""}
								onChange={(e) =>
									handleInputChange("Creador", e.target.value)
								}
							/>
						</div>

						<div className="form-group">
							<label>Usuario</label>
							<input
								type="text"
								value={itemData.Usuario || ""}
								onChange={(e) =>
									handleInputChange("Usuario", e.target.value)
								}
							/>
						</div>

						<div className="form-group form-group-full">
							<label>Géneros</label>
							<input
								type="text"
								value={itemData.Generos || ""}
								onChange={(e) =>
									handleInputChange("Generos", e.target.value)
								}
								placeholder="Separados por comas"
							/>
						</div>

						<div className="form-group form-group-full">
							<label>Resumen</label>
							<textarea
								value={itemData.Resumen || ""}
								onChange={(e) =>
									handleInputChange("Resumen", e.target.value)
								}
								rows={3}
							/>
						</div>

						<div className="form-group form-group-full">
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
						</div>
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

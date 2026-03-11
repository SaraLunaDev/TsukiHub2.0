import React, { useState } from "react";
import { MaterialSymbolsAndroidMessages } from "../../icons/MaterialSymbolsAndroidMessages";
import "./ItemCaratula.css";
import { MaterialSymbolsPlayArrowRounded } from "../../icons/MaterialSymbolsPlayArrowRounded";
import { MaterialSymbolsLightKidStar } from "../../icons/MaterialSymbolsLightKidStar";
import { MaterialSymbolsAlarm } from "../../icons/MaterialSymbolsAlarm";
import { MaterialSymbolsClose } from "../../icons/MaterialSymbolsClose";
import { MaterialSymbolsEdit } from "../../icons/MaterialSymbolsEdit";
import { API_URLS, STORAGE_KEYS } from "../../../constants/config";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { useAuth } from "../../../hooks/useAuth";

export default function ItemCaratula({
	Caratula,
	Nombre,
	Trailer,
	Fecha,
	Duracion,
	Nota,
	URL,
	Estado,
	Usuario,
	userSheet,
	Comentario,
	ID,
	Id,
	id,
	onRecommendationDeleted,
}) {
	const [hover, setHover] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [user] = useLocalStorage(STORAGE_KEYS.TWITCH_USER, null);
	const [token] = useLocalStorage(STORAGE_KEYS.TWITCH_TOKEN, null);
	const { isAdmin } = useAuth();

	const itemId = ID || Id || id;
	const canDelete =
		user &&
		(isAdmin ||
			(Estado === "Recomendacion" &&
				String(Usuario).trim() === String(user.id).trim()));

	const handleDelete = async (e) => {
		e.stopPropagation();

		if (
			!window.confirm(
				"Estas a puntito de eliminar este item... ¿Aceptas?",
			)
		) {
			return;
		}

		setDeleting(true);
		try {
			const response = await fetch(API_URLS.DELETE_RECOMMENDATION, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({
					itemId,
					tipoSheet: window.location.pathname.includes("/juegos")
						? "juegos"
						: "pelis",
				}),
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(
					data.error || "Error al eliminar la recomendacion",
				);
			}

			if (onRecommendationDeleted) {
				onRecommendationDeleted();
			}
		} catch (error) {
			console.error("Error deleting recommendation:", error);
			alert("Error al eliminar la recomendacion: " + error.message);
		} finally {
			setDeleting(false);
		}
	};

	const handleEdit = (e) => {
		e.stopPropagation();
		const isJuegos = window.location.pathname.includes("/juegos");
		const editPath = isJuegos ? "/juegos/editar/" : "/pelis/editar/";

		const encodedFecha = encodeURIComponent(Fecha || "");
		window.location.href = `${editPath}${itemId}?fecha=${encodedFecha}`;
	};

	const caratulaClass =
		Estado === "Recomendacion"
			? "item-caratula item-caratula-recomendacion"
			: "item-caratula";

	return (
		<div
			className={caratulaClass}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			{canDelete && (
				<button
					className="item-delete-btn"
					onClick={handleDelete}
					disabled={deleting}
					aria-label="Eliminar recomendacion"
				>
					<MaterialSymbolsClose />
				</button>
			)}
			{isAdmin && user && itemId && (
				<button
					className="item-edit-btn"
					onClick={handleEdit}
					aria-label="Editar item"
				>
					<MaterialSymbolsEdit />
				</button>
			)}
			{Estado === "Recomendacion" && userSheet && (
				<div className="item-nombre-superpuesta">
					{userSheet.pfp ? (
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
					<span>{userSheet.nombre || "Usuario"}</span>
				</div>
			)}
			<div className="item-img-wrapper">
				{Duracion && (
					<div className="item-duracion-superpuesta">
						<MaterialSymbolsAlarm
							style={{ marginRight: 4, marginBottom: -2 }}
						/>
						{Duracion}
					</div>
				)}
				{URL && (
					<button
						className="item-url-btn"
						onClick={(e) => {
							e.stopPropagation();
							window.open(URL, "_blank");
						}}
					>
						<MaterialSymbolsPlayArrowRounded className="item-url-icon" />
					</button>
				)}
				{Nota && (
					<div className="item-nota-superpuesta">
						<MaterialSymbolsLightKidStar
							style={{ marginRight: 4, marginBottom: -2 }}
						/>
						{Number(Nota).toFixed(1).replace(/\.0$/, "")}/10
					</div>
				)}
				<div
					style={{
						position: "relative",
						width: "100%",
						height: "100%",
					}}
				>
					<img
						src={Caratula}
						alt={`Caratula de ${
							Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""
						}`}
						className={
							Estado === "Recomendacion"
								? "item-img item-img-recomendacion"
								: "item-img"
						}
					/>
					{Estado === "Recomendacion" && hover && Comentario && (
						<div className="item-comentario-overlay">
							<MaterialSymbolsAndroidMessages
								style={{
									fontSize: 18,
									marginBottom: 2,
									marginRight: 6,
									verticalAlign: "middle",
									color: "#fff",
								}}
							/>
							<span>{Comentario}</span>
						</div>
					)}
				</div>
				{(Duracion ||
					Nota ||
					(Estado === "Recomendacion" && Comentario)) && (
					<div
						className={
							Estado === "Recomendacion"
								? "item-img-overlay-recomendacion"
								: "item-img-overlay-normal"
						}
					/>
				)}
				{Fecha && <div className="item-fecha-superpuesta">{Fecha}</div>}
			</div>
			{Trailer && Nombre ? (
				hover ? (
					<button
						className="item-trailer-btn"
						onClick={(e) => {
							e.stopPropagation();
							window.open(Trailer, "_blank");
						}}
					>
						<MaterialSymbolsPlayArrowRounded className="item-url-icon" />
						<span style={{ marginLeft: 6 }}>Trailer</span>
					</button>
				) : null
			) : null}
			<div className="item-nombre">
				{Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : ""}
			</div>
		</div>
	);
}

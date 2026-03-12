import React, { useState, useEffect } from "react";
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
import { Fa7SolidThumbsUp } from "../../icons/Fa7SolidThumbsUp";

const countsCache = new Map();

const userVotesCache = new Map();

const fetchPromises = new Map();

export async function fetchVotes(tipo, userId) {
	const key = userId ? `${tipo}:${userId}` : tipo;
	if (fetchPromises.has(key)) {
		return fetchPromises.get(key);
	}
	const promise = (async () => {
		const url = `${API_URLS.GET_VOTES}?tipo=${encodeURIComponent(tipo)}${
			userId ? `&userId=${encodeURIComponent(userId)}` : ""
		}`;
		const resp = await fetch(url);
		const data = await resp.json();

		if (data.counts) {
			const map = new Map(Object.entries(data.counts));
			countsCache.set(tipo, map);
		}

		let userSet = null;
		if (userId && data.userVotedIds) {
			userSet = new Set(data.userVotedIds);
			userVotesCache.set(`${tipo}:${userId}`, userSet);
		}

		return { counts: countsCache.get(tipo), userSet };
	})();
	fetchPromises.set(key, promise);
	promise.finally(() => fetchPromises.delete(key));
	return promise;
}

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
	onVote,
}) {
	const itemId = ID || Id || id;

	const tipo = window.location.pathname.includes("/juegos")
		? "Juegos"
		: "Pelis";

	const [user] = useLocalStorage(STORAGE_KEYS.TWITCH_USER, null);
	const [token] = useLocalStorage(STORAGE_KEYS.TWITCH_TOKEN, null);
	const { isAdmin } = useAuth();
	const [hover, setHover] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const localVotesKey = `votes_cache_${tipo}_${itemId}`;
	const [localVotes, setLocalVotes] = useLocalStorage(localVotesKey, null);
	const [votes, setVotes] = useState(0);
	const [voting, setVoting] = useState(false);
	const localHasVotedKey = `hasvoted_cache_${tipo}_${itemId}_${user?.id ?? "anon"}`;
	const [localHasVoted, setLocalHasVoted] = useLocalStorage(
		localHasVotedKey,
		false,
	);
	const [hasVoted, setHasVoted] = useState(false);

	useEffect(() => {
		if (localVotes !== null) {
			setVotes(localVotes);
		}
		setHasVoted(localHasVoted);
	}, [localVotes, localHasVoted]);

	const canDelete =
		user &&
		(isAdmin ||
			(Estado === "Recomendacion" &&
				String(Usuario).trim() === String(user.id).trim()));

	useEffect(() => {
		if (!itemId || Estado !== "Recomendacion") return;

		const idKey = String(itemId);
		let cancelled = false;
		const loadAllVotes = async () => {
			try {
				const { counts, userSet } = await fetchVotes(tipo, user?.id);
				if (!cancelled) {
					const newVotes = counts?.get(idKey) || 0;

					if (localVotes === null || newVotes !== localVotes) {
						setVotes(newVotes);
						setLocalVotes(newVotes);
					}
					if (userSet) {
						setHasVoted(userSet.has(idKey));
						setLocalHasVoted(userSet.has(idKey));
					}
				}
			} catch (err) {
				console.error("Error loading votes", err);
			}
		};

		const userKey = user && `${tipo}:${user.id}`;
		if (countsCache.has(tipo)) {
			const map = countsCache.get(tipo);
			const cachedVotes = map.get(idKey) || 0;

			if (localVotes === null || cachedVotes !== localVotes) {
				setVotes(cachedVotes);
				setLocalVotes(cachedVotes);
			}
			if (userKey && userVotesCache.has(userKey)) {
				const voted = userVotesCache.get(userKey).has(idKey);
				setHasVoted(voted);
				setLocalHasVoted(voted);
			}

			if (user && !userVotesCache.has(userKey)) {
				loadAllVotes();
			} else {
			}
		} else {
			loadAllVotes();
		}

		return () => {
			cancelled = true;
		};
	}, [
		itemId,
		tipo,
		user,
		Estado,
		setLocalVotes,
		setLocalHasVoted,
		localVotes,
	]);

	const handleVote = async (e) => {
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
		if (!user || voting) return;
		setVoting(true);
		try {
			const action = hasVoted ? "remove" : "add";
			const resp = await fetch(API_URLS.MODIFY_VOTE, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({
					tipo,
					id: itemId,
					nombre: Nombre,
					action,
				}),
			});
			const data = await resp.json();
			if (resp.ok && data.success) {
				let newVal;
				if (action === "add") {
					newVal = votes + 1;
					setHasVoted(true);
					setLocalHasVoted(true);
				} else {
					newVal = Math.max(votes - 1, 0);
					setHasVoted(false);
					setLocalHasVoted(false);
				}

				setVotes(newVal);
				setLocalVotes(newVal);

				const map = countsCache.get(tipo) || new Map();
				map.set(String(itemId), newVal);
				countsCache.set(tipo, map);

				if (user && user.id) {
					const ukey = `${tipo}:${user.id}`;
					const set = userVotesCache.get(ukey) || new Set();
					if (action === "add") {
						set.add(String(itemId));
					} else {
						set.delete(String(itemId));
					}
					userVotesCache.set(ukey, set);
				}

				if (onVote) {
					onVote(String(itemId), newVal);
				}
			} else {
				console.error("Failed to modify vote", data.error);
			}
		} catch (err) {
			console.error("Error sending vote", err);
		} finally {
			setVoting(false);
		}
	};

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
			{}
			{Estado === "Recomendacion" && (
				<div
					className={`item-votos-superpuesta${hasVoted ? " voted" : ""}${user ? " user-logged" : ""}`}
					onClick={handleVote}
					role="button"
					aria-label="Votar"
					tabIndex={user && !voting && !hasVoted ? 0 : -1}
				>
					<button
						className="vote-btn"
						disabled={!user || voting}
						aria-label="Votar"
					>
						<Fa7SolidThumbsUp
							style={{ fontSize: 14 }}
							className={
								user
									? hasVoted
										? "voted-icon"
										: ""
									: "disabled-icon"
							}
						/>
					</button>
					<span className="vote-count">{votes}</span>
				</div>
			)}
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
				{}
				{Fecha && Estado !== "Recomendacion" && (
					<div className="item-fecha-superpuesta">{Fecha}</div>
				)}
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

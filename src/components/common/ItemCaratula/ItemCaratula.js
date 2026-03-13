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
import { useSheetConfig } from "../../../hooks/useSheetConfig";
import { Fa7SolidThumbsUp } from "../../icons/Fa7SolidThumbsUp";

const countsCache = new Map();
const fetchPromises = new Map();

function votesCacheKey(tipo) {
	return `gsheet_cache_votes_${tipo}`;
}

function getVoteField(vote, ...fieldNames) {
	if (!vote || typeof vote !== "object") return "";

	for (const name of fieldNames) {
		if (vote[name] !== undefined && vote[name] !== null) {
			return String(vote[name]).trim();
		}
	}

	const target = String(fieldNames[0] || "")
		.trim()
		.toLowerCase();
	for (const key of Object.keys(vote)) {
		if (String(key).trim().toLowerCase() === target) {
			return String(vote[key]).trim();
		}
	}

	return "";
}

function getVoteId(vote) {
	return getVoteField(vote, "ID", "Id", "id", "identifier");
}

function getVoteUserId(vote) {
	return getVoteField(
		vote,
		"Usuario",
		"usuario",
		"userId",
		"user",
		"userid",
		"user_id",
	);
}

function buildCountsFromVotes(votes) {
	const counts = new Map();
	for (const vote of votes) {
		const id = getVoteId(vote);
		if (!id) continue;
		counts.set(id, (counts.get(id) || 0) + 1);
	}
	return counts;
}

function updateVoteCache(tipo, userId, itemId, nombre, action) {
	const id = String(itemId);
	const userIdStr = userId ? String(userId) : "";
	const votes = voteListsCache.get(tipo) || [];

	if (action === "add") {
		votes.push({
			Tipo: tipo,
			ID: id,
			Nombre: nombre || "",
			Usuario: userIdStr,
		});
	} else {
		const index = votes.findIndex(
			(v) => getVoteId(v) === id && getVoteUserId(v) === userIdStr,
		);
		if (index !== -1) {
			votes.splice(index, 1);
		}
	}

	voteListsCache.set(tipo, votes);
	try {
		window.localStorage.setItem(votesCacheKey(tipo), JSON.stringify(votes));
	} catch {}

	const counts = buildCountsFromVotes(votes);
	countsCache.set(tipo, counts);
	return counts.get(id) || 0;
}

const voteListsCache = new Map();

export async function fetchVotes(
	tipo,
	userId,
	{ skipCache } = { skipCache: false },
) {
	try {
		const baseKey = votesCacheKey(tipo);
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key?.startsWith(`${baseKey}_user_`)) {
				localStorage.removeItem(key);
			}
		}
	} catch {}

	const cachedCounts = countsCache.get(tipo);
	const cachedVotes = voteListsCache.get(tipo);

	const computeUserSet = (votes) => {
		if (!userId) return null;
		const set = new Set();
		for (const vote of votes || []) {
			if (getVoteUserId(vote) === String(userId)) {
				const id = getVoteId(vote);
				if (id) set.add(id);
			}
		}
		return set;
	};

	if (cachedCounts && (!userId || cachedVotes) && !skipCache) {
		void fetchVotes(tipo, userId, { skipCache: true });
		return { counts: cachedCounts, userSet: computeUserSet(cachedVotes) };
	}

	try {
		const stored = window.localStorage.getItem(votesCacheKey(tipo));
		if (stored && !skipCache) {
			const parsed = JSON.parse(stored);
			let votes = [];
			if (Array.isArray(parsed)) {
				votes = parsed;
			} else if (parsed && typeof parsed === "object") {
				votes = Object.entries(parsed).flatMap(([id, count]) =>
					Array.from({ length: Number(count) || 0 }, () => ({
						Tipo: tipo,
						ID: id,
					})),
				);
			}

			const counts = buildCountsFromVotes(votes);
			countsCache.set(tipo, counts);
			voteListsCache.set(tipo, votes);

			if (!userId) {
				return { counts, userSet: null };
			}
			const userSet = computeUserSet(votes);

			void fetchVotes(tipo, userId, { skipCache: true });
			return { counts, userSet };
		}
	} catch (e) {}

	const key = userId ? `${tipo}:${userId}` : tipo;
	if (fetchPromises.has(key)) {
		return fetchPromises.get(key);
	}

	const makeRequest = async () => {
		const url = `${API_URLS.GET_VOTES}?tipo=${encodeURIComponent(
			tipo,
		)}&raw=true${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`;
		const resp = await fetch(url);
		const data = await resp.json();

		const votes = Array.isArray(data.votes) ? data.votes : [];
		const counts = buildCountsFromVotes(votes);
		countsCache.set(tipo, counts);
		voteListsCache.set(tipo, votes);
		try {
			window.localStorage.setItem(
				votesCacheKey(tipo),
				JSON.stringify(votes),
			);
		} catch {}

		const userSet = computeUserSet(votes);
		return { counts, userSet };
	};

	const promise = makeRequest();
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
	const { config } = useSheetConfig();
	const isJuegos = window.location.pathname.includes("/juegos");
	const [hover, setHover] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [votes, setVotes] = useState(0);
	const [voting, setVoting] = useState(false);
	const [hasVoted, setHasVoted] = useState(false);

	const removeRecommendationFromLocalCache = (itemId) => {
		try {
			const sheetUrl = isJuegos
				? config?.juegosSheetUrl
				: config?.pelisSheetUrl;
			if (!sheetUrl) return;
			const cacheKey = `gsheet_cache_${sheetUrl}_default`;
			const stored = window.localStorage.getItem(cacheKey);
			if (!stored) return;
			const parsed = JSON.parse(stored);
			if (!Array.isArray(parsed)) return;
			const filtered = parsed.filter((row) => {
				const id = String(row?.ID ?? row?.Id ?? row?.id ?? "").trim();
				return id !== String(itemId).trim();
			});
			window.localStorage.setItem(cacheKey, JSON.stringify(filtered));
		} catch {}
	};

	const isOwnRecommendation =
		user &&
		Estado === "Recomendacion" &&
		String(Usuario).trim() === String(user.id).trim();

	const canDelete = user && (isAdmin || isOwnRecommendation);

	useEffect(() => {
		if (!itemId || Estado !== "Recomendacion") return;

		const idKey = String(itemId);
		let cancelled = false;
		const loadAllVotes = async () => {
			try {
				const { counts, userSet } = await fetchVotes(tipo, user?.id);
				if (!cancelled) {
					const newVotes = counts?.get(idKey) || 0;
					setVotes(newVotes);
					if (userSet) {
						setHasVoted(userSet.has(idKey));
					}
				}

				try {
					const { counts: updatedCounts, userSet: updatedUserSet } =
						await fetchVotes(tipo, user?.id, { skipCache: true });
					if (!cancelled) {
						const updatedVotes = updatedCounts?.get(idKey) || 0;
						setVotes(updatedVotes);
						if (updatedUserSet) {
							setHasVoted(updatedUserSet.has(idKey));
						}
					}
				} catch {}
			} catch (err) {
				console.error("Error loading votes", err);
			}
		};

		loadAllVotes();

		return () => {
			cancelled = true;
		};
	}, [itemId, tipo, user?.id, Estado]);

	const handleVote = async (e) => {
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
		if (!user || voting || isOwnRecommendation) return;
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
				const newVal = updateVoteCache(
					tipo,
					user?.id,
					itemId,
					Nombre,
					action,
				);
				setVotes(newVal);
				setHasVoted(action === "add");

				if (onVote) {
					onVote(String(itemId), newVal);
				}
			} else {
				if (
					resp.status === 409 &&
					data.error === "User already voted"
				) {
					try {
						const { counts, userSet } = await fetchVotes(
							tipo,
							user?.id,
						);
						const idKey = String(itemId);
						setVotes(counts?.get(idKey) || 0);
						const nowHasVoted = Boolean(userSet?.has(idKey));
						setHasVoted(nowHasVoted);

						if (nowHasVoted) {
							const resp2 = await fetch(API_URLS.MODIFY_VOTE, {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									...(token
										? { Authorization: `Bearer ${token}` }
										: {}),
								},
								body: JSON.stringify({
									tipo,
									id: itemId,
									nombre: Nombre,
									action: "remove",
								}),
							});
							const data2 = await resp2.json();
							if (resp2.ok && data2.success) {
								const newVal = updateVoteCache(
									tipo,
									user?.id,
									itemId,
									Nombre,
									"remove",
								);
								setVotes(newVal);
								setHasVoted(false);
								if (onVote) onVote(String(itemId), newVal);
							}
						}
					} catch {}
				} else if (
					resp.status === 404 &&
					data.error === "Vote not found"
				) {
					setHasVoted(false);
				}
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

			removeRecommendationFromLocalCache(itemId);
			if (onRecommendationDeleted) {
				onRecommendationDeleted(itemId);
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
					className={`item-votos-superpuesta${hasVoted ? " voted" : ""}${user ? " user-logged" : ""}${isOwnRecommendation ? " own-recommendation" : ""}${voting ? " voting" : ""}`}
					onClick={handleVote}
					role="button"
					aria-label={
						isOwnRecommendation
							? "No puedes votar tu propia recomendación"
							: "Votar"
					}
					tabIndex={
						user && !voting && !hasVoted && !isOwnRecommendation
							? 0
							: -1
					}
				>
					<button
						className="vote-btn"
						disabled={!user || voting || isOwnRecommendation}
						aria-label={
							isOwnRecommendation
								? "No puedes votar tu propia recomendación"
								: "Votar"
						}
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

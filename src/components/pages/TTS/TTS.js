import React, { useEffect, useRef, useState } from "react";
import "./TTS.css";
import SearchBar from "../../common/SearchBar";
import TutorialPanel from "./TutorialPanel";
import TextValidator from "./TextValidator";
import { MaterialSymbolsLightKidStar } from "../../icons/MaterialSymbolsLightKidStar";

const stripExt = (name = "") => name.replace(/\.[^/.]+$/, "");
const getIdFromName = (name = "") => {
	const base = stripExt(name);
	const parts = base.split("_");
	const idStr = parts[0] ?? "";
	const n = parseInt(idStr, 10);
	return Number.isFinite(n) ? n : Infinity;
};
const nameWithoutId = (name = "") => {
	const base = stripExt(name);
	const idx = base.indexOf("_");
	return idx === -1 ? base : base.slice(idx + 1);
};

const getIdFromUrl = (url = "") => {
	if (!url) return Infinity;
	try {
		const parts = String(url).split("/");
		const last = parts[parts.length - 1] || "";
		const decoded = decodeURIComponent(last);
		return getIdFromName(decoded);
	} catch (e) {
		return Infinity;
	}
};

const normalizeFavItem = (type, raw) => {
	if (!raw) return null;
	if (typeof raw === "string") {
		const name = raw;
		return { name, url: `/static/${type}s/${encodeURIComponent(name)}` };
	}
	if (raw.name) {
		return {
			name: raw.name,
			url: raw.url || `/static/${type}s/${encodeURIComponent(raw.name)}`,
			...(typeof raw.id !== "undefined" && raw.id !== null
				? { id: raw.id }
				: {}),
		};
	}
	return null;
};

const sortById = (arr = []) =>
	(arr || [])
		.filter(Boolean)
		.slice()
		.sort((a, b) => {
			const urlA = getIdFromUrl(a?.url);
			const urlB = getIdFromUrl(b?.url);
			const idA =
				typeof a?.id !== "undefined" && a.id !== null
					? a.id
					: Number.isFinite(urlA)
						? urlA
						: getIdFromName(a.name);
			const idB =
				typeof b?.id !== "undefined" && b.id !== null
					? b.id
					: Number.isFinite(urlB)
						? urlB
						: getIdFromName(b.name);
			const valA = idA === Infinity ? Number.MAX_SAFE_INTEGER : idA;
			const valB = idB === Infinity ? Number.MAX_SAFE_INTEGER : idB;
			return valA - valB;
		});

export default function TTS() {
	const [voices, setVoices] = useState([]);
	const [sounds, setSounds] = useState([]);
	const [favVoices, setFavVoices] = useState([]);
	const [favSounds, setFavSounds] = useState([]);
	const audioRef = useRef(null);
	const [playingId, setPlayingId] = useState(null);
	const [voiceSearch, setVoiceSearch] = useState("");
	const [soundSearch, setSoundSearch] = useState("");

	const touchTimerRef = useRef(null);
	const longPressTriggeredRef = useRef(false);
	const LONG_PRESS_MS = 1200;

	const matchesItem = (name = "", idCandidate, search = "") => {
		const q = String(search || "")
			.toLowerCase()
			.trim();
		if (!q) return true;
		const namePart = nameWithoutId(name).toLowerCase();
		if (namePart.includes(q)) return true;
		const idNum = getIdFromName(name);
		if (idNum === Infinity) {
			if (typeof idCandidate === "number") {
				const fileIdPadded = String(idCandidate).padStart(2, "0");
				if (fileIdPadded.includes(q)) return true;
				if (String(idCandidate).includes(q)) return true;
			} else {
				if (name.toLowerCase().includes(q)) return true;
			}
		} else {
			const padded = String(idNum).padStart(2, "0");
			if (padded.includes(q)) return true;
			if (String(idNum).includes(q)) return true;
		}
		return false;
	};

	useEffect(() => {
		let mounted = true;
		fetch("/api/get-static-assets")
			.then((r) => r.json())
			.then((data) => {
				if (!mounted) return;
				const mapAndSort = (arr = [], type) =>
					(arr || [])
						.map((x) => normalizeFavItem(type, x))
						.sort((a, b) => {
							const urlA = getIdFromUrl(a?.url);
							const urlB = getIdFromUrl(b?.url);
							const idA =
								typeof a?.id !== "undefined" && a.id !== null
									? a.id
									: Number.isFinite(urlA)
										? urlA
										: getIdFromName(a.name);
							const idB =
								typeof b?.id !== "undefined" && b.id !== null
									? b.id
									: Number.isFinite(urlB)
										? urlB
										: getIdFromName(b.name);
							const valA =
								idA === Infinity
									? Number.MAX_SAFE_INTEGER
									: idA;
							const valB =
								idB === Infinity
									? Number.MAX_SAFE_INTEGER
									: idB;
							return valA - valB;
						});
				if (data.voices) setVoices(mapAndSort(data.voices, "voice"));
				if (data.sounds) setSounds(mapAndSort(data.sounds, "sound"));
			})
			.catch(() => {
				if (!mounted) return;
				setVoices([]);
				setSounds([]);
			});
		return () => {
			mounted = false;
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("twitchToken");
		if (!token) {
			try {
				const fv = JSON.parse(
					localStorage.getItem("tts:favorites:voices") || "[]",
				);
				const fs = JSON.parse(
					localStorage.getItem("tts:favorites:sounds") || "[]",
				);
				setFavVoices(
					sortById(
						(fv || []).map((i) => normalizeFavItem("voice", i)),
					),
				);
				setFavSounds(
					sortById(
						(fs || []).map((i) => normalizeFavItem("sound", i)),
					),
				);
			} catch (e) {
				setFavVoices([]);
				setFavSounds([]);
			}
			return;
		}

		fetch("/api/user-pref", {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((r) => r.json())
			.then((data) => {
				const pref = data?.pref || {};
				const tts = pref?.TTS || {};
				const v = (tts.voiceFav || [])
					.map((i) => normalizeFavItem("voice", i))
					.filter(Boolean);
				const s = (tts.soundFav || [])
					.map((i) => normalizeFavItem("sound", i))
					.filter(Boolean);
				if (v.length || s.length) {
					setFavVoices(sortById(v));
					setFavSounds(sortById(s));
				} else {
					try {
						const fv = JSON.parse(
							localStorage.getItem("tts:favorites:voices") ||
								"[]",
						);
						const fs = JSON.parse(
							localStorage.getItem("tts:favorites:sounds") ||
								"[]",
						);
						setFavVoices(
							sortById(
								(fv || []).map((i) =>
									normalizeFavItem("voice", i),
								),
							),
						);
						setFavSounds(
							sortById(
								(fs || []).map((i) =>
									normalizeFavItem("sound", i),
								),
							),
						);
					} catch (e) {}
				}
			})
			.catch(() => {
				try {
					const fv = JSON.parse(
						localStorage.getItem("tts:favorites:voices") || "[]",
					);
					const fs = JSON.parse(
						localStorage.getItem("tts:favorites:sounds") || "[]",
					);
					setFavVoices(
						sortById(
							(fv || []).map((i) => normalizeFavItem("voice", i)),
						),
					);
					setFavSounds(
						sortById(
							(fs || []).map((i) => normalizeFavItem("sound", i)),
						),
					);
				} catch (e) {}
			});
	}, []);

	const persistToServer = async (voicesArr, soundsArr) => {
		const token =
			localStorage.getItem("twitchToken") ||
			localStorage.getItem("rolesToken");
		if (!token) {
			try {
				localStorage.setItem(
					"tts:favorites:voices",
					JSON.stringify(voicesArr),
				);
				localStorage.setItem(
					"tts:favorites:sounds",
					JSON.stringify(soundsArr),
				);
			} catch (err) {}
			return;
		}
		try {
			await fetch("/api/user-pref", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					pref: { TTS: { voiceFav: voicesArr, soundFav: soundsArr } },
				}),
			});
		} catch (err) {
			try {
				localStorage.setItem(
					"tts:favorites:voices",
					JSON.stringify(voicesArr),
				);
				localStorage.setItem(
					"tts:favorites:sounds",
					JSON.stringify(soundsArr),
				);
			} catch (e) {}
		}
	};

	const isFavorite = (type, nameOrItem) => {
		const list = type === "voice" ? favVoices : favSounds;
		if (!nameOrItem) return false;
		let idCandidate;
		let nameCandidate;
		if (typeof nameOrItem === "string") {
			nameCandidate = nameOrItem;
		} else {
			nameCandidate = nameOrItem.name;
			if (
				typeof nameOrItem.id !== "undefined" &&
				nameOrItem.id !== null
			) {
				idCandidate = nameOrItem.id;
			} else {
				const urlId = getIdFromUrl(nameOrItem.url);
				if (Number.isFinite(urlId)) idCandidate = urlId;
				else {
					const nId = getIdFromName(nameOrItem.name);
					if (Number.isFinite(nId)) idCandidate = nId;
				}
			}
		}
		return list.some((f) => {
			if (typeof idCandidate !== "undefined") {
				if (
					typeof f.id !== "undefined" &&
					f.id !== null &&
					f.id === idCandidate
				)
					return true;
				const fUrlId = getIdFromUrl(f.url);
				if (Number.isFinite(fUrlId) && fUrlId === idCandidate)
					return true;
			}
			if (f.name === nameCandidate) return true;
			if (nameWithoutId(f.name) === nameWithoutId(nameCandidate))
				return true;
			return false;
		});
	};

	const toggleFavorite = (type, asset) => {
		if (!asset || !asset.name) return;
		const isVoice = type === "voice";
		const setter = isVoice ? setFavVoices : setFavSounds;
		setter((prev) => {
			const matches = (f, a) => {
				if (!f || !a) return false;
				const fId =
					typeof f.id !== "undefined" && f.id !== null
						? f.id
						: Number.isFinite(getIdFromUrl(f.url))
							? getIdFromUrl(f.url)
							: getIdFromName(f.name);
				const aId =
					typeof a.id !== "undefined" && a.id !== null
						? a.id
						: Number.isFinite(getIdFromUrl(a.url))
							? getIdFromUrl(a.url)
							: getIdFromName(a.name);
				if (Number.isFinite(fId) && Number.isFinite(aId))
					return fId === aId;
				if (nameWithoutId(f.name) === nameWithoutId(a.name))
					return true;
				return (
					(f.name || "").toLowerCase() ===
					(a.name || "").toLowerCase()
				);
			};
			const exists = prev.some((f) => matches(f, asset));
			const next = exists
				? prev.filter((f) => !matches(f, asset))
				: sortById([...prev, normalizeFavItem(type, asset)]);
			if (isVoice) persistToServer(next, favSounds);
			else persistToServer(favVoices, next);
			return next;
		});
	};

	const playAsset = (asset, type, assetId) => {
		if (longPressTriggeredRef.current) {
			longPressTriggeredRef.current = false;
			return;
		}
		const id = `${type}-${assetId}`;
		if (playingId === id && audioRef.current) {
			const prev = audioRef.current;
			prev.onended = null;
			prev.onpause = null;
			prev.pause();
			audioRef.current = null;
			setPlayingId(null);
			return;
		}
		if (audioRef.current) {
			const prev = audioRef.current;
			prev.onended = null;
			prev.onpause = null;
			prev.pause();
			audioRef.current = null;
			setPlayingId(null);
		}
		try {
			const a = new Audio(asset.url);
			audioRef.current = a;
			setPlayingId(id);
			a.play().catch(() => {
				if (audioRef.current === a) setPlayingId(null);
			});
			a.onended = () => {
				if (audioRef.current === a) {
					setPlayingId(null);
					audioRef.current = null;
				}
			};
			a.onpause = () => {
				if (audioRef.current === a) {
					setPlayingId(null);
					audioRef.current = null;
				}
			};
		} catch (err) {
			setPlayingId(null);
		}
	};

	const handleTouchStart = (asset, type) => {
		longPressTriggeredRef.current = false;
		if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
		touchTimerRef.current = setTimeout(() => {
			longPressTriggeredRef.current = true;
			toggleFavorite(type, asset);
		}, LONG_PRESS_MS);
	};

	const handleTouchEnd = () => {
		if (touchTimerRef.current) {
			clearTimeout(touchTimerRef.current);
			touchTimerRef.current = null;
		}
		setTimeout(() => (longPressTriggeredRef.current = false), 50);
	};

	return (
		<div className="main-container">
			<div className="tts-wrapper">
				<div className="tts-data-container">
					<div className="top-section">
						<h2>Tutorial</h2>
						<div className="top-section-h2-down">
							<span>Aprende a usar el TTS</span>
						</div>
					</div>

					<div className="inset-section text-validator-section">
						<TextValidator />
					</div>
					<div className="inset-section">
						<TutorialPanel />
					</div>
				</div>
				<div className="tts-container">
					<div className="voces-section">
						<div className="top-section">
							<h2>Lista de voces</h2>
							<div className="top-section-h2-down">
								<span>
									<b>{voices.length}</b> voces
								</span>
							</div>
						</div>

						<div className="inset-section">
							<SearchBar
								className="searchbar-tts"
								placeholder="Buscar voz..."
								value={voiceSearch}
								onChange={setVoiceSearch}
							/>
							{favVoices && favVoices.length > 0 && (
								<div className="favorites-container tts-assets-list">
									{favVoices.map((f) => {
										const urlFid = getIdFromUrl(f.url);
										const fidNumber =
											typeof f.id !== "undefined" &&
											f.id !== null
												? f.id
												: Number.isFinite(urlFid)
													? urlFid
													: getIdFromName(f.name);
										if (
											!matchesItem(
												f.name,
												fidNumber,
												voiceSearch,
											)
										)
											return null;
										const fid =
											fidNumber === Infinity
												? f.name
												: String(fidNumber).padStart(
														2,
														"0",
													);
										const id = `voice-${fid}`;
										return (
											<div
												key={`fav-voice-${fid}`}
												className="asset-item favorite"
											>
												<div
													className={`tts-asset-button ${playingId === id ? "playing" : ""}`}
													role="button"
													tabIndex={0}
													onTouchStart={() =>
														handleTouchStart(
															f,
															"voice",
														)
													}
													onTouchEnd={handleTouchEnd}
													onClick={(e) => {
														if (
															longPressTriggeredRef.current
														) {
															longPressTriggeredRef.current = false;
															return;
														}
														playAsset(
															f,
															"voice",
															fid,
														);
													}}
													onKeyDown={(e) => {
														if (
															e.key === "Enter" ||
															e.key === " " ||
															e.key === "Spacebar"
														) {
															e.preventDefault();
															if (
																longPressTriggeredRef.current
															) {
																longPressTriggeredRef.current = false;
																return;
															}
															playAsset(
																f,
																"voice",
																fid,
															);
														}
													}}
													aria-pressed={
														playingId === id
													}
													title={nameWithoutId(
														f.name,
													)}
												>
													<span className="tts-button-top">
														<span className="tts-asset-id">
															{fid}
														</span>
														<span className="tts-asset-name">
															{nameWithoutId(
																f.name,
															)}
														</span>
														<button
															className="fav-toggle fav"
															onClick={(e) => {
																e.stopPropagation();
																toggleFavorite(
																	"voice",
																	f,
																);
															}}
															aria-label="Remove from favorites"
														>
															<MaterialSymbolsLightKidStar
																className="tts-asset-star"
																aria-hidden="true"
															/>
														</button>
													</span>
												</div>
											</div>
										);
									})}
								</div>
							)}

							<div className="tts-assets-list">
								{(voices || [])
									.slice()
									.sort((a, b) => {
										const urlA = getIdFromUrl(a?.url);
										const urlB = getIdFromUrl(b?.url);
										const idA =
											typeof a?.id !== "undefined" &&
											a.id !== null
												? a.id
												: Number.isFinite(urlA)
													? urlA
													: getIdFromName(a.name);
										const idB =
											typeof b?.id !== "undefined" &&
											b.id !== null
												? b.id
												: Number.isFinite(urlB)
													? urlB
													: getIdFromName(b.name);
										const valA =
											idA === Infinity
												? Number.MAX_SAFE_INTEGER
												: idA;
										const valB =
											idB === Infinity
												? Number.MAX_SAFE_INTEGER
												: idB;
										return valA - valB;
									})
									.map((v, idx) => {
										if (isFavorite("voice", v.name))
											return null;
										const urlId = getIdFromUrl(v.url);
										const idCandidate =
											typeof v.id !== "undefined" &&
											v.id !== null
												? v.id
												: Number.isFinite(urlId)
													? urlId
													: idx + 1;
										if (
											!matchesItem(
												v.name,
												idCandidate,
												voiceSearch,
											)
										)
											return null;
										const idNum =
											typeof v.id !== "undefined" &&
											v.id !== null
												? v.id
												: Number.isFinite(urlId)
													? urlId
													: getIdFromName(v.name);
										const fileId =
											idNum === Infinity
												? String(idx + 1).padStart(
														2,
														"0",
													)
												: String(idNum).padStart(
														2,
														"0",
													);
										const id = `voice-${fileId}`;
										const fav = isFavorite("voice", v.name);
										return (
											<div
												key={id}
												className="asset-item"
											>
												<div
													className={`tts-asset-button ${playingId === id ? "playing" : ""}`}
													role="button"
													tabIndex={0}
													onTouchStart={() =>
														handleTouchStart(
															v,
															"voice",
														)
													}
													onTouchEnd={handleTouchEnd}
													onClick={(e) => {
														if (
															longPressTriggeredRef.current
														) {
															longPressTriggeredRef.current = false;
															return;
														}
														playAsset(
															v,
															"voice",
															fileId,
														);
													}}
													onKeyDown={(e) => {
														if (
															e.key === "Enter" ||
															e.key === " " ||
															e.key === "Spacebar"
														) {
															e.preventDefault();
															if (
																longPressTriggeredRef.current
															) {
																longPressTriggeredRef.current = false;
																return;
															}
															playAsset(
																v,
																"voice",
																fileId,
															);
														}
													}}
													aria-label={`Play voice ${nameWithoutId(v.name)}`}
													aria-pressed={
														playingId === id
													}
													title={nameWithoutId(
														v.name,
													)}
												>
													<span className="tts-button-top">
														<span className="tts-asset-id">
															{fileId}
														</span>
														<span className="tts-asset-name">
															{nameWithoutId(
																v.name,
															)}
														</span>
														<button
															className={`fav-toggle ${fav ? "fav" : ""}`}
															onClick={(e) => {
																e.stopPropagation();
																toggleFavorite(
																	"voice",
																	v,
																);
															}}
															aria-label={
																fav
																	? "Remove from favorites"
																	: "Add to favorites"
															}
														>
															<MaterialSymbolsLightKidStar
																className="tts-asset-star"
																aria-hidden="true"
															/>
														</button>
													</span>
												</div>
											</div>
										);
									})}
							</div>
						</div>
					</div>
					<div className="sonidos-section">
						<div className="top-section" style={{ marginTop: 16 }}>
							<h2>Lista de sonidos</h2>
							<div className="top-section-h2-down">
								<span>
									<b>{sounds.length}</b> sonidos
								</span>
							</div>
						</div>

						<div className="inset-section muelle-sonido">
							<SearchBar
								className="searchbar-tts"
								placeholder="Buscar sonido..."
								value={soundSearch}
								onChange={setSoundSearch}
							/>
							<div className="muelle-sonido-scroll">
								{favSounds && favSounds.length > 0 && (
									<div className="favorites-container tts-assets-list">
										{favSounds.map((f) => {
											const urlFid = getIdFromUrl(f.url);
											const fidNumber =
												typeof f.id !== "undefined" &&
												f.id !== null
													? f.id
													: Number.isFinite(urlFid)
														? urlFid
														: getIdFromName(f.name);
											if (
												!matchesItem(
													f.name,
													fidNumber,
													soundSearch,
												)
											)
												return null;
											const fid =
												fidNumber === Infinity
													? f.name
													: String(
															fidNumber,
														).padStart(2, "0");
											const id = `sound-${fid}`;
											return (
												<div
													key={`fav-sound-${fid}`}
													className="asset-item favorite"
												>
													<div
														className={`tts-asset-button ${playingId === id ? "playing" : ""}`}
														role="button"
														tabIndex={0}
														onTouchStart={() =>
															handleTouchStart(
																f,
																"sound",
															)
														}
														onTouchEnd={
															handleTouchEnd
														}
														onClick={(e) => {
															if (
																longPressTriggeredRef.current
															) {
																longPressTriggeredRef.current = false;
																return;
															}
															playAsset(
																f,
																"sound",
																fid,
															);
														}}
														onKeyDown={(e) => {
															if (
																e.key ===
																	"Enter" ||
																e.key === " " ||
																e.key ===
																	"Spacebar"
															) {
																e.preventDefault();
																if (
																	longPressTriggeredRef.current
																) {
																	longPressTriggeredRef.current = false;
																	return;
																}
																playAsset(
																	f,
																	"sound",
																	fid,
																);
															}
														}}
														aria-pressed={
															playingId === id
														}
														title={nameWithoutId(
															f.name,
														)}
													>
														<span className="tts-button-top">
															<span className="tts-asset-id">
																{fid}
															</span>
															<span className="tts-asset-name">
																{nameWithoutId(
																	f.name,
																)}
															</span>
															<button
																className="fav-toggle fav"
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																	toggleFavorite(
																		"sound",
																		f,
																	);
																}}
																aria-label="Remove from favorites"
															>
																<MaterialSymbolsLightKidStar
																	className="tts-asset-star"
																	aria-hidden="true"
																/>
															</button>
														</span>
													</div>
												</div>
											);
										})}
									</div>
								)}

								<div className="tts-assets-list">
									{(sounds || [])
										.slice()
										.sort((a, b) => {
											const urlA = getIdFromUrl(a?.url);
											const urlB = getIdFromUrl(b?.url);
											const idA =
												typeof a?.id !== "undefined" &&
												a.id !== null
													? a.id
													: Number.isFinite(urlA)
														? urlA
														: getIdFromName(a.name);
											const idB =
												typeof b?.id !== "undefined" &&
												b.id !== null
													? b.id
													: Number.isFinite(urlB)
														? urlB
														: getIdFromName(b.name);
											const valA =
												idA === Infinity
													? Number.MAX_SAFE_INTEGER
													: idA;
											const valB =
												idB === Infinity
													? Number.MAX_SAFE_INTEGER
													: idB;
											return valA - valB;
										})
										.map((s, idx) => {
											if (isFavorite("sound", s.name))
												return null;
											const urlId = getIdFromUrl(s.url);
											const idCandidate =
												typeof s.id !== "undefined" &&
												s.id !== null
													? s.id
													: Number.isFinite(urlId)
														? urlId
														: idx + 1;
											if (
												!matchesItem(
													s.name,
													idCandidate,
													soundSearch,
												)
											)
												return null;
											const idNum =
												typeof s.id !== "undefined" &&
												s.id !== null
													? s.id
													: Number.isFinite(urlId)
														? urlId
														: getIdFromName(s.name);
											const fileId =
												idNum === Infinity
													? String(idx + 1).padStart(
															2,
															"0",
														)
													: String(idNum).padStart(
															2,
															"0",
														);
											const id = `sound-${fileId}`;
											const fav = isFavorite(
												"sound",
												s.name,
											);
											return (
												<div
													key={id}
													className="asset-item"
												>
													<div
														className={`tts-asset-button ${playingId === id ? "playing" : ""}`}
														role="button"
														tabIndex={0}
														onTouchStart={() =>
															handleTouchStart(
																s,
																"sound",
															)
														}
														onTouchEnd={
															handleTouchEnd
														}
														onClick={(e) => {
															if (
																longPressTriggeredRef.current
															) {
																longPressTriggeredRef.current = false;
																return;
															}
															playAsset(
																s,
																"sound",
																fileId,
															);
														}}
														onKeyDown={(e) => {
															if (
																e.key ===
																	"Enter" ||
																e.key === " " ||
																e.key ===
																	"Spacebar"
															) {
																e.preventDefault();
																if (
																	longPressTriggeredRef.current
																) {
																	longPressTriggeredRef.current = false;
																	return;
																}
																playAsset(
																	s,
																	"sound",
																	fileId,
																);
															}
														}}
														aria-label={`Play sound ${nameWithoutId(s.name)}`}
														aria-pressed={
															playingId === id
														}
														title={nameWithoutId(
															s.name,
														)}
													>
														<span className="tts-button-top">
															<span className="tts-asset-id">
																{fileId}
															</span>
															<span className="tts-asset-name">
																{nameWithoutId(
																	s.name,
																)}
															</span>
															<button
																className={`fav-toggle ${fav ? "fav" : ""}`}
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																	toggleFavorite(
																		"sound",
																		s,
																	);
																}}
																aria-label={
																	fav
																		? "Remove from favorites"
																		: "Add to favorites"
																}
															>
																<MaterialSymbolsLightKidStar
																	className={`tts-asset-star ${fav ? "fav" : ""}`}
																	aria-hidden="true"
																/>
															</button>
														</span>
													</div>
												</div>
											);
										})}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

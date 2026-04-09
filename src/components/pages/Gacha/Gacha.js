import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";
import { useSheetConfig } from "../../../hooks/useSheetConfig";
import { useAuth } from "../../../hooks/useAuth";
import useLocalStorage from "../../../hooks/useLocalStorage";
import SearchBar from "../../common/SearchBar";
import GachaCard from "../../common/GachaCard/GachaCard";
import GachaData from "../../common/GachaData/GachaData";
import UserRanking from "../../common/UserRanking/UserRanking";
import * as DragonBallIcon from "../../icons/Gacha/DragonBall";
import * as FromSoftwareIcon from "../../icons/Gacha/FromSoftware";
import * as GenshinImpactIcon from "../../icons/Gacha/GenshinImpact";
import * as MonsterHunterIcon from "../../icons/Gacha/MonsterHunter";
import * as OnePieceIcon from "../../icons/Gacha/OnePiece";
import * as SmashBrosIcon from "../../icons/Gacha/SmashBros";
import "./Gacha.css";

function resolveIcon(mod, preferredName) {
	if (!mod) return null;
	if (mod[preferredName]) return mod[preferredName];
	if (mod.default) return mod.default;
	const first = Object.values(mod).find((v) => typeof v === "function");
	return first || null;
}

const BANNER_ICONS = {
	db: resolveIcon(DragonBallIcon, "DragonBall"),
	fs: resolveIcon(FromSoftwareIcon, "FromSoftware"),
	gs: resolveIcon(GenshinImpactIcon, "GenshinImpact"),
	mh: resolveIcon(MonsterHunterIcon, "MonsterHunter"),
	op: resolveIcon(OnePieceIcon, "OnePiece"),
	sb: resolveIcon(SmashBrosIcon, "SmashBros"),
};

const BANNERS = [
	{ name: "db", displayName: "Dragon Ball" },
	{ name: "fs", displayName: "FromSoftware" },
	{ name: "gs", displayName: "Genshin Impact" },
	{ name: "mh", displayName: "Monster Hunter" },
	{ name: "op", displayName: "One Piece" },
	{ name: "sb", displayName: "Smash Bros" },
];

const BANNER_TO_FOLDER = {
	db: "db",
	fs: "fs",
	gs: "gs",
	mh: "mh",
	op: "op",
	sb: "sb",
};

function Gacha() {
	const { banner } = useParams();
	const navigate = useNavigate();
	const { config } = useSheetConfig();
	const { user } = useAuth();
	const { data: charData, loading: charLoading } = useGoogleSheet(
		config?.gachaCharSheetUrl || "",
	);
	const { data: userData, loading: userLoading } = useGoogleSheet(
		config?.gachaSheetUrl || "",
	);
	const { data: usersData } = useGoogleSheet(
		config?.usuariosSheetUrl || "",
		"userData",
	);

	const [userSearchText, setUserSearchText] = useState("");
	const [isMobileRankingOpen, setIsMobileRankingOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useLocalStorage(
		"gacha_selectedUser",
		"",
	);
	const [selectedCharacter, setSelectedCharacter] = useState(null);

	const activeBanner = banner || "gs";

	useEffect(() => {
		if (!BANNERS.find((b) => b.name === activeBanner)) {
			navigate("/gacha/gs");
		}
	}, [activeBanner, navigate]);

	const loading = charLoading || userLoading;

	const { characters, users, userCount, totalCharactersGlobal } =
		useMemo(() => {
			if (!charData || !charData.length) {
				return {
					characters: [],
					users: [],
					userCount: new Map(),
					totalCharactersGlobal: 0,
				};
			}
			if (!userData || !userData.length) {
				return {
					characters: [],
					users: [],
					userCount: new Map(),
					totalCharactersGlobal: 0,
				};
			}

			const totalCharactersGlobal = charData.filter(
				(row) => !row.eliminado_en,
			).length;

			const bannerChars = charData
				.filter(
					(row) =>
						String(row.banner_id || "").trim() === activeBanner &&
						!row.eliminado_en,
				)
				.map((row) => ({
					id: String(row.personaje_id || "").trim(),
					name: String(row.personaje_nombre || "")
						.trim()
						.toLowerCase(),
					tier: parseInt(row.personaje_tier),
					banner: activeBanner,
					bannerDisplay: BANNERS.find((b) => b.name === activeBanner)
						?.displayName,
					lowUrl: `/static/resources/gacha/${BANNER_TO_FOLDER[activeBanner]}/low/${String(row.personaje_id || "").trim()}_low.webp`,
					highUrl: `/static/resources/gacha/${BANNER_TO_FOLDER[activeBanner]}/high/${String(row.personaje_id || "").trim()}_high.webp`,
				}));

			const userMap = new Map();
			const countMap = new Map();

			userData.forEach((row) => {
				const userId = String(row.usuario_id || "").trim();
				if (!userId || row.eliminado_en) return;
				countMap.set(userId, (countMap.get(userId) || 0) + 1);
				if (!userMap.has(userId)) {
					const userInfo = usersData?.find(
						(u) => String(u.id).trim() === String(userId).trim(),
					);
					userMap.set(userId, {
						id: userId,
						nombre: userInfo?.nombre || userId,
						pfp:
							userInfo?.imagen_perfil ||
							`https://decapi.me/twitch/avatar/${userInfo?.nombre || userId}`,
					});
				}
			});

			const uniqueUsers = Array.from(userMap.values());

			return {
				characters: bannerChars,
				users: uniqueUsers,
				userCount: countMap,
				totalCharactersGlobal,
			};
		}, [charData, userData, usersData, activeBanner]);

	const handleUserClick = (userId) => {
		setSelectedUser(userId);
		setUserSearchText("");
	};

	const filteredUsers = useMemo(() => {
		if (!userSearchText) return users;
		return users.filter((u) =>
			u.nombre.toLowerCase().includes(userSearchText.toLowerCase()),
		);
	}, [users, userSearchText]);

	useEffect(() => {
		if (!userSearchText) return;
		if (filteredUsers.length === 1) {
			const newId = filteredUsers[0].id;
			if (selectedUser !== newId) {
				setSelectedUser(newId);
			}
		} else if (filteredUsers.length > 1) {
			const exactMatch = filteredUsers.find(
				(u) => u.nombre.toLowerCase() === userSearchText.toLowerCase(),
			);
			if (exactMatch && selectedUser !== exactMatch.id) {
				setSelectedUser(exactMatch.id);
			}
		}
	}, [userSearchText, filteredUsers, setSelectedUser, selectedUser]);

	useEffect(() => {
		if (users.length === 0) return;
		if (!selectedUser) {
			if (user?.username) {
				const loggedUser = users.find(
					(u) => u.id.toLowerCase() === user.username.toLowerCase(),
				);
				if (loggedUser) {
					setSelectedUser(loggedUser.id);
					return;
				}
			}

			let maxCount = 0;
			let userWithMost = users[0]?.id;

			userCount.forEach((count, userId) => {
				if (count > maxCount) {
					maxCount = count;
					userWithMost = userId;
				}
			});

			setSelectedUser(userWithMost);
		}
	}, [users, selectedUser, setSelectedUser, user, userCount]);

	const currentUser = users.find((u) => u.id === selectedUser);

	const { tier3Grid, tier4Grid, tier5Grid } = useMemo(() => {
		const tier3 = [];
		const tier4 = [];
		const tier5 = [];

		const ownedSet = new Set(
			(userData || [])
				.filter(
					(row) =>
						String(row.usuario_id || "").trim() ===
							String(selectedUser || "").trim() &&
						String(row.banner_id || "").trim() === activeBanner &&
						!row.eliminado_en,
				)
				.map((row) => String(row.personaje_id || "").trim())
				.filter(Boolean),
		);

		characters.forEach((char) => {
			const owned = ownedSet.has(char.id) || false;
			const gridChar = { ...char, owned };

			if (char.tier === 3) {
				tier3.push(gridChar);
			} else if (char.tier === 4) {
				tier4.push(gridChar);
			} else if (char.tier === 5) {
				tier5.push(gridChar);
			}
		});

		const total = tier3.length + tier4.length + tier5.length;
		const ownedCount =
			tier3.filter((c) => c.owned).length +
			tier4.filter((c) => c.owned).length +
			tier5.filter((c) => c.owned).length;
		const percentage =
			total > 0 ? Math.round((ownedCount / total) * 100) : 0;

		return {
			tier3Grid: tier3,
			tier4Grid: tier4,
			tier5Grid: tier5,
			totalOwned: ownedCount,
			completionPercentage: percentage,
			totalCharactersBanner: total,
			totalCharactersGlobal,
		};
	}, [
		characters,
		selectedUser,
		userData,
		activeBanner,
		totalCharactersGlobal,
	]);

	useEffect(() => {
		if (!selectedUser) return;

		const storageKey = `gacha_selectedCharacter_${selectedUser}_${activeBanner}`;
		const savedCharacterId = localStorage.getItem(storageKey);

		if (savedCharacterId) {
			const allChars = [...tier3Grid, ...tier4Grid, ...tier5Grid];
			const savedCharacter = allChars.find(
				(c) => c.owned && c.id === savedCharacterId,
			);
			if (savedCharacter) {
				setSelectedCharacter(savedCharacter);
				return;
			}
		}

		const firstOwned =
			tier5Grid.find((c) => c.owned) ||
			tier4Grid.find((c) => c.owned) ||
			tier3Grid.find((c) => c.owned);
		if (firstOwned) {
			setSelectedCharacter(firstOwned);
		} else {
			setSelectedCharacter(null);
		}
	}, [tier3Grid, tier4Grid, tier5Grid, selectedUser, activeBanner]);

	const totalOwnedGlobal = userCount.get(selectedUser) || 0;
	const completionPercentageGlobal =
		totalCharactersGlobal > 0
			? Math.round((totalOwnedGlobal / totalCharactersGlobal) * 100)
			: 0;

	const handleCharacterClick = (character) => {
		setSelectedCharacter(character);
		const storageKey = `gacha_selectedCharacter_${selectedUser}_${activeBanner}`;
		localStorage.setItem(storageKey, character.id);
	};

	const handleBannerChange = (bannerName) => {
		navigate(`/gacha/${bannerName}`);
		setSelectedCharacter(null);
	};

	if (loading) {
		return (
			<div className="main-container">
				<div className="loading">Cargando Gacha...</div>
			</div>
		);
	}

	return (
		<div className="main-container">
			<div className="gacha-wrapper">
				<div className="gacha-data-container">
					<div className="top-section">
						<h2>Gacha de {currentUser?.nombre || "Usuario"}</h2>
						<div className="top-section-h2-down">
							<span>
								<b>{totalOwnedGlobal}</b> obtenidos
							</span>
							<span>
								<b>{completionPercentageGlobal}%</b>
							</span>
						</div>
					</div>

					<div className="user-search-above-ranking">
						<SearchBar
							placeholder="Buscar usuario..."
							value={userSearchText}
							onChange={setUserSearchText}
							showChevronButton={true}
							onChevronClick={() =>
								setIsMobileRankingOpen(!isMobileRankingOpen)
							}
							isChevronOpen={isMobileRankingOpen}
						/>
						{isMobileRankingOpen && (
							<div
								className="mobile-ranking-popup-overlay"
								onClick={() => setIsMobileRankingOpen(false)}
							>
								<div
									className="mobile-ranking-popup"
									onClick={(e) => e.stopPropagation()}
								>
									<div className="mobile-ranking-header">
										<h3>Ranking de Usuarios</h3>
										<button
											className="mobile-ranking-close"
											onClick={() =>
												setIsMobileRankingOpen(false)
											}
										>
											✕
										</button>
									</div>
									<UserRanking
										users={users}
										pokemonCount={userCount}
										selectedUser={selectedUser}
										handleUserClick={(userId) => {
											handleUserClick(userId);
											setIsMobileRankingOpen(false);
										}}
										totalCharacters={totalCharactersGlobal}
										className="mobile-ranking-content"
									/>
								</div>
							</div>
						)}
					</div>

					<UserRanking
						users={users}
						pokemonCount={userCount}
						selectedUser={selectedUser}
						handleUserClick={handleUserClick}
						totalCharacters={totalCharactersGlobal}
						className="desktop-only"
					/>

					<GachaData
						selectedCharacter={selectedCharacter}
						banner={activeBanner}
					/>
				</div>

				<div className="gacha-container">
					<div className="top-section gacha-top-section">
						<div className="gacha-top-controls">
							<div className="gacha-banner-buttons">
								{BANNERS.map((b) => {
									const IconComponent = BANNER_ICONS[b.name];
									return (
										<button
											key={b.name}
											className={`gacha-banner-button ${
												activeBanner === b.name
													? "active"
													: ""
											}`}
											onClick={() =>
												handleBannerChange(b.name)
											}
										>
											{IconComponent && (
												<IconComponent className="nav-icon" />
											)}
											<span className="nav-text">
												{b.displayName}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					<div className="inset-section">
						<div className="gacha-tier-grid">
							<div className="gacha-grid">
								{tier5Grid.map((char, index) => (
									<GachaCard
										key={`${char.id}-${index}`}
										character={char}
										onClick={handleCharacterClick}
									/>
								))}
							</div>
						</div>
						<hr
							style={{
								borderColor: "var(--divider)",
								height: "1px",
								margin: "16px 0",
							}}
						/>
						<div className="gacha-tier-grid">
							<div className="gacha-grid">
								{tier4Grid.map((char, index) => (
									<GachaCard
										key={`${char.id}-${index}`}
										character={char}
										onClick={handleCharacterClick}
									/>
								))}
							</div>
						</div>
						<hr
							style={{
								borderColor: "var(--divider)",
								height: "1px",
								margin: "16px 0",
							}}
						/>
						<div className="gacha-tier-grid">
							<div className="gacha-grid">
								{tier3Grid.map((char, index) => (
									<GachaCard
										key={`${char.id}-${index}`}
										character={char}
										onClick={handleCharacterClick}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Gacha;

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
		config?.userdataSheetUrl || "",
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

			const parsedChars = charData.map((row) => ({
				gs_ID: row["gs_ID"]?.toString().trim(),
				gs_Nombre: row["gs_Nombre"]?.toString().trim(),
				gs_Tier: row["gs_Tier"]?.toString().trim(),
				mh_ID: row["mh_ID"]?.toString().trim(),
				mh_Nombre: row["mh_Nombre"]?.toString().trim(),
				mh_Tier: row["mh_Tier"]?.toString().trim(),
				op_ID: row["op_ID"]?.toString().trim(),
				op_Nombre: row["op_Nombre"]?.toString().trim(),
				op_Tier: row["op_Tier"]?.toString().trim(),
				fs_ID: row["fs_ID"]?.toString().trim(),
				fs_Nombre: row["fs_Nombre"]?.toString().trim(),
				fs_Tier: row["fs_Tier"]?.toString().trim(),
				db_ID: row["db_ID"]?.toString().trim(),
				db_Nombre: row["db_Nombre"]?.toString().trim(),
				db_Tier: row["db_Tier"]?.toString().trim(),
				sb_ID: row["sb_ID"]?.toString().trim(),
				sb_Nombre: row["sb_Nombre"]?.toString().trim(),
				sb_Tier: row["sb_Tier"]?.toString().trim(),
			}));

			let totalCharactersGlobal = 0;
			BANNERS.forEach((b) => {
				parsedChars.forEach((char) => {
					const idKey = `${b.name}_ID`;
					const nameKey = `${b.name}_Nombre`;
					const tierKey = `${b.name}_Tier`;
					if (char[idKey] && char[nameKey] && char[tierKey]) {
						totalCharactersGlobal++;
					}
				});
			});

			const bannerChars = [];
			parsedChars.forEach((char) => {
				const idKey = `${activeBanner}_ID`;
				const nameKey = `${activeBanner}_Nombre`;
				const tierKey = `${activeBanner}_Tier`;
				if (char[idKey] && char[nameKey] && char[tierKey]) {
					bannerChars.push({
						id: char[idKey],
						name: char[nameKey]?.toString().trim().toLowerCase(),
						tier: parseInt(char[tierKey]),
						banner: activeBanner,
						bannerDisplay: BANNERS.find(
							(b) => b.name === activeBanner,
						).displayName,
						lowUrl: `/static/resources/gacha/${BANNER_TO_FOLDER[activeBanner]}/low/${char[idKey]}_low.webp`,
						highUrl: `/static/resources/gacha/${BANNER_TO_FOLDER[activeBanner]}/high/${char[idKey]}_high.webp`,
					});
				}
			});

			const userMap = new Map();
			const countMap = new Map();

			userData.forEach((row) => {
				const userId = row["id"]?.toString().trim();
				const userName = row["user"]?.toString().trim();
				if (userId && userName) {
					const userDataInfo = usersData?.find(
						(u) => String(u.id).trim() === String(userId).trim(),
					);
					if (!userMap.has(userId)) {
						userMap.set(userId, {
							id: userId,
							nombre: userName,
							pfp:
								userDataInfo?.pfp ||
								`https://decapi.me/twitch/avatar/${userDataInfo?.nombre || userName}`,
						});
					}

					let ownedCount = 0;
					BANNERS.forEach((b) => {
						for (let tier = 3; tier <= 5; tier++) {
							const tierKey = `${b.name}${tier}`;
							const tierChars = row[tierKey]?.toString().trim();
							if (tierChars) {
								const chars = tierChars
									.split("/-/")
									.filter((c) => c.trim());
								ownedCount += chars.length;
							}
						}
					});
					countMap.set(userId, ownedCount);
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

		const userRow = userData?.find(
			(row) => String(row.id).trim() === String(selectedUser).trim(),
		);

		const ownedSets = {};
		for (let t = 3; t <= 5; t++) {
			const tierKey = `${activeBanner}${t}`;
			const tierCharsStr = userRow?.[tierKey]?.toString().trim() || "";
			ownedSets[t] = new Set(
				tierCharsStr
					? tierCharsStr
							.split("/-/")
							.map((c) => c.trim().toLowerCase())
					: [],
			);
		}

		characters.forEach((char) => {
			const owned =
				ownedSets[char.tier]?.has(char.name.toLowerCase()) || false;
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

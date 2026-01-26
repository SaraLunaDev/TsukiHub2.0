import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";
import { useSheetConfig } from "../../../hooks/useSheetConfig";
import { useAuth } from "../../../hooks/useAuth";
import useLocalStorage from "../../../hooks/useLocalStorage";
import SearchBar from "../../common/SearchBar";
import PokemonCard from "../../common/PokemonCard/PokemonCard";
import PokemonData from "../../common/PokemonData/PokemonData";
import UserRanking from "../../common/UserRanking/UserRanking";
import { Kanto } from "../../icons/Pokemon/Kanto";
import { Johto } from "../../icons/Pokemon/Johto";
import { Hoenn } from "../../icons/Pokemon/Hoenn";
import { Sinnoh } from "../../icons/Pokemon/Sinnoh";
import { Teselia } from "../../icons/Pokemon/Teselia";
import { Kalos } from "../../icons/Pokemon/Kalos";
import { Alola } from "../../icons/Pokemon/Alola";
import { Galar } from "../../icons/Pokemon/Galar";
import { Paldea } from "../../icons/Pokemon/Paldea";
import "./Pokedex.css";

const TYPE_IMAGES = {};
const typeNames = [
	"bug",
	"dark",
	"dragon",
	"electric",
	"fairy",
	"fighting",
	"fire",
	"flying",
	"ghost",
	"grass",
	"ground",
	"ice",
	"normal",
	"poison",
	"psychic",
	"rock",
	"steel",
	"water",
];
typeNames.forEach((type) => {
	const img = new Image();
	img.src = `/static/resources/pokemon/types/${type}.png`;
	TYPE_IMAGES[type] = img;
});

const GENERATION_RANGES = {
	1: { start: 1, end: 151 },
	2: { start: 152, end: 251 },
	3: { start: 252, end: 386 },
	4: { start: 387, end: 493 },
	5: { start: 494, end: 649 },
	6: { start: 650, end: 721 },
	7: { start: 722, end: 809 },
	8: { start: 810, end: 905 },
	9: { start: 906, end: 1025 },
};

const REGIONS = [
	{ name: "Kanto", generation: 1, icon: Kanto },
	{ name: "Johto", generation: 2, icon: Johto },
	{ name: "Hoenn", generation: 3, icon: Hoenn },
	{ name: "Sinnoh", generation: 4, icon: Sinnoh },
	{ name: "Teselia", generation: 5, icon: Teselia },
	{ name: "Kalos", generation: 6, icon: Kalos },
	{ name: "Alola", generation: 7, icon: Alola },
	{ name: "Galar", generation: 8, icon: Galar },
	{ name: "Paldea", generation: 9, icon: Paldea },
];

function Pokedex() {
	const { region } = useParams();
	const navigate = useNavigate();
	const { config } = useSheetConfig();
	const { user } = useAuth();
	const { data: rawData, loading } = useGoogleSheet(
		config?.pokedexSheetUrl || "",
	);
	const { data: usersData } = useGoogleSheet(
		config?.userdataSheetUrl || "",
		"userData",
	);

	const [userSearchText, setUserSearchText] = useState("");
	const [isMobileRankingOpen, setIsMobileRankingOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useLocalStorage(
		"pokedex_selectedUser",
		"",
	);
	const [selectedPokemon, setSelectedPokemon] = useState(null);

	const activeRegion = region || "kanto";
	const activeGeneration =
		REGIONS.find((r) => r.name.toLowerCase() === activeRegion)
			?.generation || 1;

	useEffect(() => {
		if (!REGIONS.find((r) => r.name.toLowerCase() === activeRegion)) {
			navigate("/pokedex/kanto");
		}
	}, [activeRegion, navigate]);

	const { pokemonList, users, pokemonCount } = useMemo(() => {
		if (!rawData || !rawData.length) {
			return { pokemonList: [], users: [], pokemonCount: new Map() };
		}

		const parsedData = rawData.map((row) => ({
			pokemonId: row["id"]?.toString().trim(),
			pokemonName: row["Pokemon"]?.toString().trim(),
			tipo1: row["Tipo1"]?.toString().trim(),
			tipo2: row["Tipo2"]?.toString().trim(),
			movimiento1: row["Movimiento1"]?.toString().trim(),
			movimiento2: row["Movimiento2"]?.toString().trim(),
			movimiento3: row["Movimiento3"]?.toString().trim(),
			movimiento4: row["Movimiento4"]?.toString().trim(),
			Usuario: row["ID Usuario"]?.toString().trim(),
			Shiny: row["Shiny"]?.toString().trim(),
			HP: row["HP"]?.toString().trim(),
			Ataque: row["Ataque"]?.toString().trim(),
			Defensa: row["Defensa"]?.toString().trim(),
			AtaqueEsp: row["AtaqueEsp"]?.toString().trim(),
			DefensaEsp: row["DefensaEsp"]?.toString().trim(),
			Velocidad: row["Velocidad"]?.toString().trim(),
			ivHP: row["ivHP"]?.toString().trim(),
			ivAtaque: row["ivAtaque"]?.toString().trim(),
			ivDefensa: row["ivDefensa"]?.toString().trim(),
			ivAtaqueEsp: row["ivAtaqueEsp"]?.toString().trim(),
			ivDefensaEsp: row["ivDefensaEsp"]?.toString().trim(),
			ivVelocidad: row["ivVelocidad"]?.toString().trim(),
			XP: row["XP"]?.toString().trim(),
			Peso: row["Peso"]?.toString().trim(),
		}));

		const userMap = new Map();
		const pokemonCount = new Map();

		parsedData.forEach((pokemon) => {
			if (pokemon.Usuario) {
				const userData = usersData?.find(
					(u) =>
						String(u.id).trim() === String(pokemon.Usuario).trim(),
				);
				if (!userMap.has(pokemon.Usuario)) {
					userMap.set(pokemon.Usuario, {
						id: pokemon.Usuario,
						nombre:
							userData?.nombre || `Usuario ${pokemon.Usuario}`,
						pfp:
							userData?.pfp ||
							`https://decapi.me/twitch/avatar/${userData?.nombre || pokemon.Usuario}`,
					});
				}
				pokemonCount.set(
					pokemon.Usuario,
					(pokemonCount.get(pokemon.Usuario) || 0) + 1,
				);
			}
		});
		const uniqueUsers = Array.from(userMap.values());

		return { pokemonList: parsedData, users: uniqueUsers, pokemonCount };
	}, [rawData, usersData]);

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
			let userWithMostPokemon = users[0]?.id;

			pokemonCount.forEach((count, userId) => {
				if (count > maxCount) {
					maxCount = count;
					userWithMostPokemon = userId;
				}
			});

			setSelectedUser(userWithMostPokemon);
		}
	}, [users, selectedUser, setSelectedUser, user, pokemonCount]);

	const getPokemonUrls = (pokemonId, shiny = false) => {
		const baseUrl =
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
		const shinyPath = shiny ? "shiny/" : "";
		return {
			staticUrl: `${baseUrl}/${shinyPath}${pokemonId}.png`,
			gifUrl: `${baseUrl}/versions/generation-v/black-white/animated/${shinyPath}${pokemonId}.gif`,
		};
	};

	const filteredUsers = useMemo(() => {
		if (!userSearchText) return users;
		return users.filter((user) =>
			user.nombre.toLowerCase().includes(userSearchText.toLowerCase()),
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
				(user) =>
					user.nombre.toLowerCase() === userSearchText.toLowerCase(),
			);
			if (exactMatch && selectedUser !== exactMatch.id) {
				setSelectedUser(exactMatch.id);
			}
		}
	}, [userSearchText, filteredUsers, setSelectedUser, selectedUser]);

	const currentUser = users.find((user) => user.id === selectedUser);
	const currentUserName = currentUser?.nombre || "Usuario";

	const pokemonGrid = useMemo(() => {
		const { start, end } = GENERATION_RANGES[activeGeneration];
		const generationSize = end - start + 1;

		return Array.from({ length: generationSize }, (_, index) => {
			const id = start + index;

			const matchedPokemon = pokemonList.find(
				(p) =>
					parseInt(p.pokemonId, 10) === id &&
					p.Usuario === selectedUser,
			);

			if (!matchedPokemon) {
				return {
					id: id.toString(),
					captured: false,
					shiny: false,
					...getPokemonUrls(id, false),
				};
			}

			const isShiny = matchedPokemon.Shiny?.toLowerCase() === "si";
			return {
				...matchedPokemon,
				id: id.toString(),
				captured: true,
				shiny: isShiny,
				...getPokemonUrls(id, isShiny),
			};
		});
	}, [pokemonList, selectedUser, activeGeneration]);

	const activeGenerations = useMemo(() => {
		const activeGens = [];
		for (let gen = 1; gen <= 9; gen++) {
			const { start, end } = GENERATION_RANGES[gen];
			const hasAnyPokemon = pokemonList.some((p) => {
				const id = parseInt(p.pokemonId, 10);
				return id >= start && id <= end;
			});
			if (hasAnyPokemon) {
				activeGens.push(gen);
			} else {
				break;
			}
		}
		return activeGens;
	}, [pokemonList]);

	const { totalCaptured, completionPercentage } = useMemo(() => {
		let captured = 0;
		let totalPossible = 0;

		activeGenerations.forEach((gen) => {
			const { start, end } = GENERATION_RANGES[gen];
			totalPossible += end - start + 1;

			captured += pokemonList.filter((p) => {
				const id = parseInt(p.pokemonId, 10);
				return id >= start && id <= end && p.Usuario === selectedUser;
			}).length;
		});

		const percentage =
			totalPossible > 0
				? ((captured / totalPossible) * 100).toFixed(0)
				: 0;

		return {
			totalCaptured: captured,
			completionPercentage: percentage,
		};
	}, [pokemonList, selectedUser, activeGenerations]);

	const { capturedCount, shinyCount, totalPokemon } = useMemo(() => {
		const { start, end } = GENERATION_RANGES[activeGeneration];
		const total = end - start + 1;
		const captured = pokemonGrid.filter(
			(p) => p.captured && p.id && parseInt(p.id) <= end,
		).length;
		const shinies = pokemonGrid.filter(
			(p) => p.shiny && p.id && parseInt(p.id) <= end,
		).length;
		return {
			capturedCount: captured,
			shinyCount: shinies,
			totalPokemon: total,
		};
	}, [pokemonGrid, activeGeneration]);

	const maxStats = useMemo(() => {
		if (!pokemonList || pokemonList.length === 0) {
			return {
				HP: 255,
				Ataque: 190,
				Defensa: 230,
				AtaqueEsp: 194,
				DefensaEsp: 230,
				Velocidad: 180,
				Total: 720,
			};
		}

		const max = {
			HP: 0,
			Ataque: 0,
			Defensa: 0,
			AtaqueEsp: 0,
			DefensaEsp: 0,
			Velocidad: 0,
			Total: 0,
		};

		pokemonList.forEach((p) => {
			const hp = parseInt(p.HP) || 0;
			const atk = parseInt(p.Ataque) || 0;
			const def = parseInt(p.Defensa) || 0;
			const spa = parseInt(p.AtaqueEsp) || 0;
			const spd = parseInt(p.DefensaEsp) || 0;
			const spe = parseInt(p.Velocidad) || 0;
			const total = hp + atk + def + spa + spd + spe;

			if (hp > max.HP) max.HP = hp;
			if (atk > max.Ataque) max.Ataque = atk;
			if (def > max.Defensa) max.Defensa = def;
			if (spa > max.AtaqueEsp) max.AtaqueEsp = spa;
			if (spd > max.DefensaEsp) max.DefensaEsp = spd;
			if (spe > max.Velocidad) max.Velocidad = spe;
			if (total > max.Total) max.Total = total;
		});

		return max;
	}, [pokemonList]);

	useEffect(() => {
		if (!selectedUser) return;

		const storageKey = `pokedex_selectedPokemon_${selectedUser}_${activeRegion}`;
		const savedPokemonId = localStorage.getItem(storageKey);

		if (savedPokemonId) {
			const savedPokemon = pokemonGrid.find(
				(p) => p.captured && p.id === savedPokemonId,
			);
			if (savedPokemon) {
				setSelectedPokemon(savedPokemon);
				return;
			}
		}

		const firstCaptured = pokemonGrid.find((p) => p.captured);
		if (firstCaptured) {
			setSelectedPokemon(firstCaptured);
		} else {
			setSelectedPokemon(null);
		}
	}, [pokemonGrid, selectedUser, activeRegion]);

	const handleRegionChange = (newRegion) => {
		navigate(`/pokedex/${newRegion}`);
	};

	const handlePokemonClick = (pokemon) => {
		setSelectedPokemon(pokemon);
		const storageKey = `pokedex_selectedPokemon_${selectedUser}_${activeRegion}`;
		localStorage.setItem(storageKey, pokemon.id);
	};

	const handleUserClick = (userId) => {
		setSelectedUser(userId);
		setUserSearchText("");
	};

	if (loading) {
		return (
			<div className="main-container">
				<div className="loading">Cargando Pokedex...</div>
			</div>
		);
	}

	return (
		<div className="main-container">
			<div className="pokedex-wrapper">
				<div className="pokemon-data-container">
					<div className="top-section">
						<h2>Pokedex de {currentUserName}</h2>
						<div className="top-section-h2-down">
							<span>
								<b>{totalCaptured}</b> capturados
							</span>
							<span>
								<b>{completionPercentage}%</b>
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
					</div>

					<UserRanking
						users={users}
						pokemonCount={pokemonCount}
						selectedUser={selectedUser}
						handleUserClick={handleUserClick}
						activeGenerations={activeGenerations}
						pokemonList={pokemonList}
						GENERATION_RANGES={GENERATION_RANGES}
						className="desktop-only"
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
									pokemonCount={pokemonCount}
									selectedUser={selectedUser}
									handleUserClick={(userId) => {
										handleUserClick(userId);
										setIsMobileRankingOpen(false);
									}}
									activeGenerations={activeGenerations}
									pokemonList={pokemonList}
									GENERATION_RANGES={GENERATION_RANGES}
									className="mobile-ranking-content"
								/>
							</div>
						</div>
					)}
					<PokemonData
						selectedPokemon={selectedPokemon}
						maxStats={maxStats}
						capturedCount={capturedCount}
						totalPokemon={totalPokemon}
						shinyCount={shinyCount}
					/>
				</div>

				<div className="pokedex-container">
					<div className="top-section pokedex-top-section">
						<div className="pokedex-top-controls">
							<div className="pokedex-region-buttons">
								{REGIONS.map((reg) => {
									const IconComponent = reg.icon;
									return (
										<button
											key={reg.generation}
											className={`pokedex-region-button ${
												activeRegion ===
												reg.name.toLowerCase()
													? "active"
													: ""
											}`}
											onClick={() =>
												handleRegionChange(
													reg.name.toLowerCase(),
												)
											}
										>
											<IconComponent className="nav-icon" />
											<span className="nav-text">
												{reg.name}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					<div className="inset-section">
						<div className="pokemon-grid">
							{pokemonGrid.map((pokemon, index) => (
								<PokemonCard
									key={`${pokemon.id || "empty"}-${index}`}
									pokemon={pokemon}
									onClick={handlePokemonClick}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Pokedex;

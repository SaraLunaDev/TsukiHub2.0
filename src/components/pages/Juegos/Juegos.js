import React, { useState } from "react";
import useLocalStorage from "../../../hooks/useLocalStorage";
import "./Juegos.css";
import ItemCaratula from "../../common/ItemCaratula/ItemCaratula";
import ItemImagenList from "../../common/ItemImagenList/ItemImagenList";
import { MaterialSymbolsListsRounded } from "../../icons/MaterialSymbolsListsRounded";
import { TablerLayoutGridFilled } from "../../icons/TablerLayoutGridFilled";
import { CarruselImagen } from "../../common/Carousel/CarruselImagen";
import { Carousel } from "../../common/Carousel/Carousel";
import "../../common/Carousel/Carousel.css";
import { useGoogleSheet } from "../../../hooks/useGoogleSheet";
import { useSheetConfig } from "../../../hooks/useSheetConfig";

import FilterSection from "../../common/FilterSection/FilterSection";
import YearFilter from "../../common/FilterSection/YearFilter";
import OrderFilter from "../../common/FilterSection/OrderFilter";
import TypeFilter from "../../common/FilterSection/TypeFilter";
import SearchBar from "../../common/FilterSection/SearchBar";
import GenreFilter from "../../common/FilterSection/GenreFilter";

function Juegos() {
	const { config } = useSheetConfig();
	const {
		data: rawData,
		loading,
		error,
		refetch,
	} = useGoogleSheet(config?.itemsSheetUrl || "");
	const { data: comentariosData } = useGoogleSheet(
		config?.comentariosSheetUrl || "",
	);
	const { data: usersData } = useGoogleSheet(
		config?.usuariosSheetUrl || "",
		"userData",
	);

	const data = React.useMemo(() => {
		if (!rawData) return [];
		return rawData.filter(
			(row) =>
				(row.tipo || "").toLowerCase() === "juego" &&
				!(row.eliminado_en || ""),
		);
	}, [rawData]);

	const normalizeItemRow = React.useCallback(
		(row) => {
			const comment = comentariosData
				? (
						comentariosData.find(
							(c) =>
								String(c.item_id || "").trim() ===
									String(row.id || "").trim() &&
								String(c.usuario_id || "").trim() ===
									String(row.usuario_id || "").trim(),
						) || {}
					).comentario || ""
				: "";
			return {
				...row,
				ID: row.id,
				Nombre: row.nombre,
				Estado: row.estado,
				Tipo: row.plataforma,
				Fecha: row.fecha,
				URL: row.youtube_url,
				Caratula: row.caratula,
				Imagen: row.imagen,
				Duracion: row.duracion,
				Nota: row.nota,
				Trailer: row.trailer,
				Generos: row.generos,
				Resumen: row.resumen,
				Fecha_Salida: row.fecha_salida,
				Nota_Global: row.nota_global,
				Creador: row.creador,
				Usuario: row.usuario_id,
				Comentario: comment,
			};
		},
		[comentariosData],
	);

	const getUserById = (id) => {
		if (!usersData || !id) return null;
		const found = usersData.find(
			(u) => String(u.id).trim() === String(id).trim(),
		);
		if (!found) return null;
		return { ...found, pfp: found.imagen_perfil || "" };
	};
	const [showFilter, setShowFilter] = useState(false);

	const [isGrid, setIsGrid] = useLocalStorage("juegos_isGrid", false);
	const [selectedYear, setSelectedYear] = useState("");
	const [order, setOrder] = useState("desc");
	const [selectedType, setSelectedType] = useState("");
	const [searchText, setSearchText] = useState("");

	const genreOptions = React.useMemo(() => {
		if (!data) return [];
		const set = new Set();
		data.filter((row) =>
			["pasado", "pausado", "dropeado"].includes(
				(row["estado"] || "").toLowerCase(),
			),
		).forEach((row) => {
			if (row["generos"]) {
				row["generos"].split(",").forEach((g) => set.add(g.trim()));
			}
		});
		return Array.from(set).sort();
	}, [data]);
	const [selectedGenre, setSelectedGenre] = useState("");

	const cleanType = (str) =>
		str ? str.replace(/\s*\(.*?\)\s*/g, "").trim() : "";
	const typeOptions = React.useMemo(() => {
		if (!data) return [];
		const set = new Set();
		data.filter((row) =>
			["pasado", "pausado", "dropeado"].includes(
				(row["estado"] || "").toLowerCase(),
			),
		).forEach((row) => {
			if (row["plataforma"]) set.add(cleanType(row["plataforma"]));
		});
		return Array.from(set).sort();
	}, [data]);

	const years = React.useMemo(() => {
		if (!data) return [];
		const set = new Set();
		data.filter((row) =>
			["pasado", "pausado", "dropeado"].includes(
				(row["estado"] || "").toLowerCase(),
			),
		).forEach((row) => {
			if (row["fecha"]) {
				const parts = row["fecha"].split("/");
				if (parts.length === 3) set.add(parts[2]);
			}
		});
		return Array.from(set).sort((a, b) => b - a);
	}, [data]);

	const filteredJugados = data
		? data
				.filter((row) =>
					["pasado", "pausado", "dropeado"].includes(
						(row["estado"] || "").toLowerCase(),
					),
				)
				.filter(
					(row) =>
						(!selectedYear ||
							(row["fecha"] &&
								row["fecha"].endsWith("/" + selectedYear))) &&
						(!selectedType ||
							cleanType(row["plataforma"]) === selectedType) &&
						(!selectedGenre ||
							(row["generos"] &&
								row["generos"]
									.split(",")
									.map((g) => g.trim())
									.includes(selectedGenre))) &&
						(!searchText ||
							Object.values(row).some(
								(v) =>
									v &&
									v
										.toString()
										.toLowerCase()
										.includes(searchText.toLowerCase()),
							)),
				)
		: [];

	return (
		<div className="main-container">
			{data &&
				(data.some(
					(row) =>
						(row["estado"] || "").trim().toLowerCase() === "ahora",
				) ||
					data.some(
						(row) =>
							(row["estado"] || "").trim().toLowerCase() ===
							"planeo",
					)) && (
					<div style={{ display: "flex", gap: 24 }}>
						<div className="hide-mobile" style={{ flex: 0 }}>
							<div className="top-section">
								<h2>Jugando</h2>
								<div className="top-section-h2-down">
									<span>
										<b>
											{
												data.filter(
													(row) =>
														(row["estado"] || "")
															.trim()
															.toLowerCase() ===
														"ahora",
												).length
											}
										</b>{" "}
										entrada
										{data.filter(
											(row) =>
												(row["estado"] || "")
													.trim()
													.toLowerCase() === "ahora",
										).length === 1
											? ""
											: "s"}
									</span>
								</div>
							</div>
							<div className="inset-section">
								<Carousel
									items={data.filter(
										(row) =>
											(row["estado"] || "")
												.trim()
												.toLowerCase() === "ahora",
									)}
									renderItem={(row, idx) => (
										<ItemCaratula
											key={"jugando-" + idx}
											{...normalizeItemRow(row)}
											onRecommendationDeleted={refetch}
										/>
									)}
								/>
							</div>
						</div>
						<div style={{ flex: 1 }}>
							<div className="top-section">
								<h2>Planeo Jugar</h2>
								<div className="top-section-h2-down">
									<span>
										<b>
											{
												data.filter(
													(row) =>
														(row["estado"] || "")
															.trim()
															.toLowerCase() ===
														"planeo",
												).length
											}
										</b>{" "}
										entrada
										{data.filter(
											(row) =>
												(row["estado"] || "")
													.trim()
													.toLowerCase() === "planeo",
										).length === 1
											? ""
											: "s"}
									</span>
								</div>
							</div>
							<div className="inset-section">
								<CarruselImagen
									items={data
										.filter(
											(row) =>
												(row["estado"] || "")
													.trim()
													.toLowerCase() === "planeo",
										)
										.map(normalizeItemRow)}
								/>
							</div>
						</div>
					</div>
				)}
			<div className="top-section" style={{ marginTop: 16 }}>
				<h2>Juegos Jugados</h2>
				<div className="top-section-h2-down">
					<span>
						<b>{filteredJugados.length}</b> entrada
						{filteredJugados.length === 1 ? "" : "s"}
					</span>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<FilterSection
							label="Filtrar"
							open={showFilter}
							onClick={() => setShowFilter((v) => !v)}
							divProps={{ style: { display: "none" } }}
						/>
						<button
							aria-label={isGrid ? "Vista lista" : "Vista grid"}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
							}}
							onClick={() => setIsGrid((v) => !v)}
						>
							{isGrid ? (
								<MaterialSymbolsListsRounded
									style={{
										fontSize: 20,
										color: "var(--text-2)",
									}}
								/>
							) : (
								<TablerLayoutGridFilled
									style={{
										fontSize: 20,
										color: "var(--text-2)",
									}}
								/>
							)}
						</button>
					</div>
				</div>
			</div>
			{showFilter && (
				<div className="filter-section">
					<OrderFilter value={order} onChange={setOrder} />
					<YearFilter
						years={years}
						selected={selectedYear}
						onChange={setSelectedYear}
					/>
					<TypeFilter
						options={typeOptions}
						selected={selectedType}
						onChange={setSelectedType}
						label="Plataforma"
					/>
					<GenreFilter
						options={genreOptions}
						value={selectedGenre}
						onChange={setSelectedGenre}
					/>
					<SearchBar
						value={searchText}
						onChange={setSearchText}
						placeholder="Buscar..."
					/>
				</div>
			)}
			{loading ? (
				<div style={{ textAlign: "center", margin: "2em 0" }}>
					Cargando...
				</div>
			) : error ? (
				<div
					style={{
						color: "red",
						textAlign: "center",
						margin: "2em 0",
					}}
				>
					{error}
				</div>
			) : (
				<div className="inset-section">
					{filteredJugados.length > 0 ? (
						isGrid ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 16,
								}}
							>
								{filteredJugados
									.sort((a, b) => {
										const parse = (d) => {
											if (!d) return 0;
											const [day, month, year] = d
												.split("/")
												.map(Number);
											return new Date(
												year,
												month - 1,
												day,
											).getTime();
										};
										const parseDuration = (str) => {
											if (!str) return 0;
											str = str
												.replace(/\s+/g, "")
												.toLowerCase();
											let h = 0,
												m = 0;
											const hMatch = str.match(/(\d+)h/);
											const mMatch = str.match(/(\d+)m/);
											if (hMatch)
												h = parseInt(hMatch[1], 10);
											if (mMatch)
												m = parseInt(mMatch[1], 10);
											return h * 60 + m;
										};
										switch (order) {
											case "asc":
												return (
													parse(a["fecha"]) -
													parse(b["fecha"])
												);
											case "name-az":
												return (
													a["nombre"] || ""
												).localeCompare(
													b["nombre"] || "",
												);
											case "name-za":
												return (
													b["nombre"] || ""
												).localeCompare(
													a["nombre"] || "",
												);
											case "nota-desc":
												return (
													(Number(b["nota"]) || 0) -
													(Number(a["nota"]) || 0)
												);
											case "nota-asc":
												return (
													(Number(a["nota"]) || 0) -
													(Number(b["nota"]) || 0)
												);
											case "duracion-desc":
												return (
													parseDuration(
														b["duracion"],
													) -
													parseDuration(a["duracion"])
												);
											case "duracion-asc":
												return (
													parseDuration(
														a["duracion"],
													) -
													parseDuration(b["duracion"])
												);
											case "desc":
											default:
												return (
													parse(b["fecha"]) -
													parse(a["fecha"])
												);
										}
									})
									.map((row, idx) => (
										<ItemImagenList
											key={idx}
											{...normalizeItemRow(row)}
											userSheet={getUserById(
												row.usuario_id,
											)}
										/>
									))}
							</div>
						) : (
							<div className="juegos-grid">
								{filteredJugados
									.sort((a, b) => {
										const parse = (d) => {
											if (!d) return 0;
											const [day, month, year] = d
												.split("/")
												.map(Number);
											return new Date(
												year,
												month - 1,
												day,
											).getTime();
										};
										const parseDuration = (str) => {
											if (!str) return 0;
											str = str
												.replace(/\s+/g, "")
												.toLowerCase();
											let h = 0,
												m = 0;
											const hMatch = str.match(/(\d+)h/);
											const mMatch = str.match(/(\d+)m/);
											if (hMatch)
												h = parseInt(hMatch[1], 10);
											if (mMatch)
												m = parseInt(mMatch[1], 10);
											return h * 60 + m;
										};
										switch (order) {
											case "asc":
												return (
													parse(a["fecha"]) -
													parse(b["fecha"])
												);
											case "name-az":
												return (
													a["nombre"] || ""
												).localeCompare(
													b["nombre"] || "",
												);
											case "name-za":
												return (
													b["nombre"] || ""
												).localeCompare(
													a["nombre"] || "",
												);
											case "nota-desc":
												return (
													(Number(b["nota"]) || 0) -
													(Number(a["nota"]) || 0)
												);
											case "nota-asc":
												return (
													(Number(a["nota"]) || 0) -
													(Number(b["nota"]) || 0)
												);
											case "duracion-desc":
												return (
													parseDuration(
														b["duracion"],
													) -
													parseDuration(a["duracion"])
												);
											case "duracion-asc":
												return (
													parseDuration(
														a["duracion"],
													) -
													parseDuration(b["duracion"])
												);
											case "desc":
											default:
												return (
													parse(b["fecha"]) -
													parse(a["fecha"])
												);
										}
									})
									.map((row, idx) => (
										<ItemCaratula
											key={idx}
											{...normalizeItemRow(row)}
											userSheet={getUserById(
												row.usuario_id,
											)}
										/>
									))}
							</div>
						)
					) : (
						<div
							style={{
								textAlign: "center",
								padding: 15,
								color: "var(--text-2)",
							}}
						>
							No hay juegos disponibles, jope..
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default Juegos;

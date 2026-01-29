import React, { useState } from "react";
import useLocalStorage from "../../../hooks/useLocalStorage";
import "./Pelis.css";
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

function Pelis() {
	const { config } = useSheetConfig();
	const { data, loading, error } = useGoogleSheet(
		config?.pelisSheetUrl || "",
	);
	const [showFilter, setShowFilter] = useState(false);

	const [isGrid, setIsGrid] = useLocalStorage("pelis_isGrid", false);
	const [selectedYear, setSelectedYear] = useState("");
	const [order, setOrder] = useState("desc");
	const [selectedType, setSelectedType] = useState("");
	const [searchText, setSearchText] = useState("");

	const genreOptions = React.useMemo(() => {
		if (!data) return [];
		const set = new Set();
		data.filter(
			(row) => (row["Estado"] || "").toLowerCase() === "pasado",
		).forEach((row) => {
			if (row["Generos"]) {
				row["Generos"].split(",").forEach((g) => set.add(g.trim()));
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
		data.filter(
			(row) => (row["Estado"] || "").toLowerCase() === "pasado",
		).forEach((row) => {
			if (row["Tipo"]) set.add(cleanType(row["Tipo"]));
		});
		return Array.from(set).sort();
	}, [data]);

	const years = React.useMemo(() => {
		if (!data) return [];
		const set = new Set();
		data.filter(
			(row) => (row["Estado"] || "").toLowerCase() === "pasado",
		).forEach((row) => {
			if (row["Fecha"]) {
				const parts = row["Fecha"].split("/");
				if (parts.length === 3) set.add(parts[2]);
			}
		});
		return Array.from(set).sort((a, b) => b - a);
	}, [data]);

	const filteredVistas = data
		? data
				.filter(
					(row) => (row["Estado"] || "").toLowerCase() === "pasado",
				)
				.filter(
					(row) =>
						(!selectedYear ||
							(row["Fecha"] &&
								row["Fecha"].endsWith("/" + selectedYear))) &&
						(!selectedType ||
							cleanType(row["Tipo"]) === selectedType) &&
						(!selectedGenre ||
							(row["Generos"] &&
								row["Generos"]
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
						(row["Estado"] || "").trim().toLowerCase() === "ahora",
				) ||
					data.some(
						(row) =>
							(row["Estado"] || "").trim().toLowerCase() ===
							"planeo",
					)) && (
					<div style={{ display: "flex", gap: 24 }}>
						<div className="hide-mobile" style={{ flex: 0 }}>
							<div className="top-section">
								<h2>Proximamente</h2>
								<div className="top-section-h2-down">
									<span>
										<b>
											{
												data.filter(
													(row) =>
														(row["Estado"] || "")
															.trim()
															.toLowerCase() ===
														"ahora",
												).length
											}
										</b>{" "}
										entrada
										{data.filter(
											(row) =>
												(row["Estado"] || "")
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
											(row["Estado"] || "")
												.trim()
												.toLowerCase() === "ahora",
									)}
									renderItem={(row, idx) => (
										<ItemCaratula
											key={"proximamente-" + idx}
											{...row}
										/>
									)}
								/>
							</div>
						</div>
						<div style={{ flex: 1 }}>
							<div className="top-section">
								<h2>Planeo Ver</h2>
								<div className="top-section-h2-down">
									<span>
										<b>
											{
												data.filter(
													(row) =>
														(row["Estado"] || "")
															.trim()
															.toLowerCase() ===
														"planeo",
												).length
											}
										</b>{" "}
										entrada
										{data.filter(
											(row) =>
												(row["Estado"] || "")
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
									items={data.filter(
										(row) =>
											(row["Estado"] || "")
												.trim()
												.toLowerCase() === "planeo",
									)}
								/>
							</div>
						</div>
					</div>
				)}
			<div className="top-section" style={{ marginTop: 16 }}>
				<h2>Peliculas y Series Vistas</h2>
				<div className="top-section-h2-down">
					<span>
						<b>{filteredVistas.length}</b> entrada
						{filteredVistas.length === 1 ? "" : "s"}
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
						label="Tipo"
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
					{filteredVistas.length > 0 ? (
						isGrid ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 16,
								}}
							>
								{filteredVistas
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
													parse(a["Fecha"]) -
													parse(b["Fecha"])
												);
											case "name-az":
												return (
													a["Nombre"] || ""
												).localeCompare(
													b["Nombre"] || "",
												);
											case "name-za":
												return (
													b["Nombre"] || ""
												).localeCompare(
													a["Nombre"] || "",
												);
											case "nota-desc":
												return (
													(Number(b["Nota"]) || 0) -
													(Number(a["Nota"]) || 0)
												);
											case "nota-asc":
												return (
													(Number(a["Nota"]) || 0) -
													(Number(b["Nota"]) || 0)
												);
											case "duracion-desc":
												return (
													parseDuration(
														b["Duracion"],
													) -
													parseDuration(a["Duracion"])
												);
											case "duracion-asc":
												return (
													parseDuration(
														a["Duracion"],
													) -
													parseDuration(b["Duracion"])
												);
											case "desc":
											default:
												return (
													parse(b["Fecha"]) -
													parse(a["Fecha"])
												);
										}
									})
									.map((row, idx) => (
										<ItemImagenList key={idx} {...row} />
									))}
							</div>
						) : (
							<div className="pelis-grid">
								{filteredVistas
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
													parse(a["Fecha"]) -
													parse(b["Fecha"])
												);
											case "name-az":
												return (
													a["Nombre"] || ""
												).localeCompare(
													b["Nombre"] || "",
												);
											case "name-za":
												return (
													b["Nombre"] || ""
												).localeCompare(
													a["Nombre"] || "",
												);
											case "nota-desc":
												return (
													(Number(b["Nota"]) || 0) -
													(Number(a["Nota"]) || 0)
												);
											case "nota-asc":
												return (
													(Number(a["Nota"]) || 0) -
													(Number(b["Nota"]) || 0)
												);
											case "duracion-desc":
												return (
													parseDuration(
														b["Duracion"],
													) -
													parseDuration(a["Duracion"])
												);
											case "duracion-asc":
												return (
													parseDuration(
														a["Duracion"],
													) -
													parseDuration(b["Duracion"])
												);
											case "desc":
											default:
												return (
													parse(b["Fecha"]) -
													parse(a["Fecha"])
												);
										}
									})
									.map((row, idx) => (
										<ItemCaratula key={idx} {...row} />
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
							No hay pelis disponibles, jope..
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default Pelis;

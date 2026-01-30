import { MaterialSymbolsPlayArrowRounded } from "../../icons/MaterialSymbolsPlayArrowRounded";
import "./ItemImagen.css";

import { MaterialSymbolsLightKidStar } from "../../icons/MaterialSymbolsLightKidStar";

export default function ItemImagen({
	Imagen,
	Nombre,
	Resumen,
	Trailer,
	Generos,
	Fecha_Salida,
	Tipo,
	Creador,
	Nota_Global,
	Caratula,
	Duracion,
	Usuario,
	userSheet,
	Comentario,
	Estado,
}) {
	if (!Imagen) return null;
	let nombrePrincipal = Nombre ? Nombre.replace(/\s*\[[^\]]*\]$/, "") : "";
	let nombreSecundario = null;
	if (Nombre) {
		const match = Nombre.match(/\[([^\]]+)\]/);
		if (match) {
			nombreSecundario = match[1];
		}
	}
	let tipoSinParentesis = Tipo ? Tipo.replace(/\s*\([^)]*\)/g, "") : "";

	return (
		<div className="item-imagen-wrapper">
			<img
				src={Imagen}
				alt={Nombre ? `Imagen de ${nombrePrincipal}` : "Item"}
				className="item-imagen-img"
			/>
			<div className="item-imagen-overlay" />
			<div className="item-imagen-content-caratula">
				<div className="item-imagen-content-main">
					<header className="item-imagen-header">
						{nombrePrincipal && (
							<h2 className="item-imagen-nombre">
								{nombrePrincipal}
							</h2>
						)}
						{nombreSecundario && (
							<div className="item-imagen-nombre-secundario">
								{nombreSecundario}
							</div>
						)}
						{(Fecha_Salida ||
							tipoSinParentesis ||
							Creador ||
							Duracion) && (
							<div className="item-imagen-fecha-tipo">
								{tipoSinParentesis && (
									<span>{tipoSinParentesis}</span>
								)}
								{tipoSinParentesis && Fecha_Salida && (
									<span> · </span>
								)}
								{Fecha_Salida && <span>{Fecha_Salida}</span>}
								{Fecha_Salida && Duracion && <span> · </span>}
								{Duracion && <span>{Duracion}</span>}
								{(Fecha_Salida ||
									tipoSinParentesis ||
									Duracion) &&
									Creador && (
										<span className="item-imagen-creador-sep">
											{" "}
											·{" "}
										</span>
									)}
								{Creador && (
									<span className="item-imagen-creador">
										{Creador}
									</span>
								)}
							</div>
						)}
					</header>

					{Resumen && (
						<p className="item-imagen-resumen">{Resumen}</p>
					)}
					{Usuario && Comentario && (
						<div
							className="item-imagen-comentario"
							style={{
								marginTop: 8,
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-start",
								gap: 4,
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
								}}
							>
								{userSheet && userSheet.pfp ? (
									<img
										src={userSheet.pfp}
										alt={
											userSheet?.nombre ||
											(Usuario &&
												String(Usuario).trim()) ||
											"Usuario"
										}
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
								<span style={{ fontWeight: "bold" }}>
									{userSheet?.nombre ||
										(Usuario && String(Usuario).trim()) ||
										"Usuario"}
									:
								</span>
							</div>
							<span
								style={{ color: "var(--text-2)", marginTop: 2 }}
							>
								{Comentario}
							</span>
						</div>
					)}
					<footer className="item-imagen-footer">
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
							}}
						>
							{Trailer && (
								<button
									className="item-imagen-trailer-btn"
									onClick={(e) => {
										e.stopPropagation();
										window.open(Trailer, "_blank");
									}}
								>
									<MaterialSymbolsPlayArrowRounded
										style={{ fontSize: 18, marginRight: 4 }}
									/>
									Ver Trailer
								</button>
							)}
							<span className="item-imagen-nota-global">
								<MaterialSymbolsLightKidStar
									className="item-imagen-nota-estrella"
									style={{
										fontSize: 18,
										verticalAlign: "middle",
										marginRight: 2,
										marginTop: 2,
									}}
								/>
								<span className="item-imagen-nota-texto">
									{Nota_Global
										? Number(
												Number(Nota_Global).toFixed(2),
											).toString()
										: "N/A"}{" "}
									<span className="item-imagen-nota-fuente">
										{(() => {
											const tipoNorm = (
												tipoSinParentesis || ""
											)
												.normalize("NFD")
												.replace(/\p{Diacritic}/gu, "")
												.trim()
												.toLowerCase();
											return [
												"pelicula",
												"serie",
											].includes(tipoNorm)
												? "IMDB"
												: "IGDB";
										})()}
									</span>
								</span>
							</span>
						</div>
						{Generos && (
							<div className="item-imagen-generos">
								{Generos.split(",").map((g, i) => (
									<span
										key={i}
										className="item-imagen-genero"
									>
										{g.trim()}
									</span>
								))}
							</div>
						)}
					</footer>
				</div>
				{Caratula && (
					<div className="item-imagen-caratula-container">
						<img
							src={Caratula}
							alt="Carátula"
							className="item-imagen-caratula"
						/>
					</div>
				)}
			</div>
		</div>
	);
}

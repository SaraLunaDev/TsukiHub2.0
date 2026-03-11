import React, { useState } from "react";
import "./UpdateMissingIds.css";

function UpdateMissingIds() {
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState(null);
	const [error, setError] = useState("");

	const runUpdate = async (sheetName, dryRun = true) => {
		setLoading(true);
		setError("");
		setResults(null);

		try {
			const response = await fetch("/api/update-missing-ids", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sheetName, dryRun }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error en la operación");
			}

			setResults(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="main-container">
			<div className="top-section">
				<h2>Actualizar IDs Faltantes</h2>
				<p>
					Esta herramienta busca películas y juegos sin ID en la base
					de datos, los busca en las APIs y actualiza los IDs cuando
					encuentra coincidencias exactas.
				</p>
			</div>

			<div className="inset-section">
				<div className="update-ids-controls">
					<div className="button-group">
						<h3>Películas y Series</h3>
						<button
							onClick={() => runUpdate("Pelis New", true)}
							disabled={loading}
							className="button-secondary"
						>
							{loading ? "Ejecutando..." : "Vista Previa (Pelis)"}
						</button>
						<button
							onClick={() => runUpdate("Pelis New", false)}
							disabled={loading}
							className="button-primary"
						>
							{loading
								? "Ejecutando..."
								: "Actualizar IDs (Pelis)"}
						</button>
					</div>

					<div className="button-group">
						<h3>Juegos</h3>
						<button
							onClick={() => runUpdate("Juegos New", true)}
							disabled={loading}
							className="button-secondary"
						>
							{loading
								? "Ejecutando..."
								: "Vista Previa (Juegos)"}
						</button>
						<button
							onClick={() => runUpdate("Juegos New", false)}
							disabled={loading}
							className="button-primary"
						>
							{loading
								? "Ejecutando..."
								: "Actualizar IDs (Juegos)"}
						</button>
					</div>
				</div>

				{error && <div className="error-message">{error}</div>}

				{results && (
					<div className="results-section">
						<h3>
							Resultados{" "}
							{results.dryRun
								? "(Vista Previa)"
								: "(Actualización Realizada)"}
						</h3>

						<div className="results-summary">
							<div className="stat-item">
								<strong>Hoja:</strong> {results.sheetName}
							</div>
							<div className="stat-item">
								<strong>Total de filas:</strong>{" "}
								{results.totalRows}
							</div>
							<div className="stat-item">
								<strong>Filas sin ID:</strong>{" "}
								{results.rowsWithoutId}
							</div>
							<div className="stat-item">
								<strong>IDs encontrados:</strong>{" "}
								{results.updatesFound}
							</div>
							<div className="stat-item">
								<strong>Errores:</strong>{" "}
								{results.errors?.length || 0}
							</div>
						</div>

						{results.updates && results.updates.length > 0 && (
							<div className="updates-section">
								<h4>IDs Encontrados:</h4>
								<div className="updates-list">
									{results.updates.map((update, index) => (
										<div
											key={index}
											className="update-item"
										>
											<div className="update-header">
												<strong>
													Fila {update.rowIndex}:
												</strong>{" "}
												{update.nombre}
											</div>
											<div className="update-details">
												<span className="update-id">
													ID: {update.foundId}
												</span>
												{update.match.fecha && (
													<span className="update-meta">
														Fecha:{" "}
														{update.match.fecha}
													</span>
												)}
												{update.match.generos &&
													update.match.generos
														.length > 0 && (
														<span className="update-meta">
															Géneros:{" "}
															{Array.isArray(
																update.match
																	.generos,
															)
																? update.match.generos.join(
																		", ",
																	)
																: update.match
																		.generos}
														</span>
													)}
												{update.match.creador && (
													<span className="update-meta">
														Creador:{" "}
														{update.match.creador}
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{results.errors && results.errors.length > 0 && (
							<div className="errors-section">
								<h4>Errores (mostrando primeros 10):</h4>
								<div className="errors-list">
									{results.errors.map((error, index) => (
										<div key={index} className="error-item">
											<div className="error-header">
												<strong>
													Fila {error.row}:
												</strong>{" "}
												{error.nombre || "Sin nombre"}
											</div>
											<div className="error-message">
												{error.error}
											</div>
											{error.searchResults &&
												error.searchResults.length >
													0 && (
													<div className="search-results">
														Resultados encontrados:{" "}
														{error.searchResults
															.map(
																(r) => r.nombre,
															)
															.join(", ")}
													</div>
												)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</main>
	);
}

export default UpdateMissingIds;

import { getValues, updateValues } from "../lib/sheets-client.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeText = (text) =>
	String(text || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim();

const extractMainName = (fullName) => {
	const match = String(fullName || "").match(/^([^\[]+)/);
	return match ? match[1].trim() : String(fullName || "").trim();
};

const extractAlternateName = (fullName) => {
	const match = String(fullName || "").match(/\[([^\]]+)\]/);
	return match ? match[1].trim() : null;
};

const compareArrays = (arr1, arr2) => {
	if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;

	const norm1 = arr1.map(normalizeText).sort();
	const norm2 = arr2.map(normalizeText).sort();

	const coincidencias = norm1.filter((g1) =>
		norm2.some((g2) => g1.includes(g2) || g2.includes(g1)),
	);

	console.log(
		`	    Comparing genres: sheet=[${norm1.join(", ")}] vs api=[${norm2.join(", ")}] -> matches: ${coincidencias.length}`,
	);

	const minMatches = Math.min(2, Math.min(norm1.length, norm2.length));
	return coincidencias.length >= minMatches;
};

const searchTMDB = async (query) => {
	try {
		const apiKey = process.env.TMDB_API_KEY;
		if (!apiKey) throw new Error("TMDB API key missing");

		const response = await fetch(
			`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=es-ES&page=1`,
		);

		if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
		const data = await response.json();

		const genresResponse = await fetch(
			`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=es-ES`,
		);
		const tvGenresResponse = await fetch(
			`https://api.themoviedb.org/3/genre/tv/list?api_key=${apiKey}&language=es-ES`,
		);

		let movieGenres = {};
		let tvGenres = {};

		if (genresResponse.ok) {
			const genresData = await genresResponse.json();
			movieGenres = Object.fromEntries(
				genresData.genres?.map((g) => [g.id, g.name]) || [],
			);
		}

		if (tvGenresResponse.ok) {
			const tvGenresData = await tvGenresResponse.json();
			tvGenres = Object.fromEntries(
				tvGenresData.genres?.map((g) => [g.id, g.name]) || [],
			);
		}

		return (
			data.results?.slice(0, 10).map((item) => ({
				id: String(item.id),
				nombre: item.title || item.name,
				fecha: item.release_date || item.first_air_date,
				tipo: item.media_type,
				generos: (item.genre_ids || []).map((id) => {
					const genres =
						item.media_type === "tv" ? tvGenres : movieGenres;
					return genres[id] || `Genre ${id}`;
				}),
			})) || []
		);
	} catch (error) {
		console.error(`Error searching TMDB for "${query}":`, error);
		return [];
	}
};

const searchIGDB = async (query) => {
	try {
		const tokenResp = await fetch(
			`https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
			{ method: "POST" },
		);

		const tokenData = await tokenResp.json();
		if (!tokenData.access_token) throw new Error("No IGDB access_token");

		const sanitizedQuery = String(query)
			.replace(/"/g, '\\"')
			.substring(0, 100);

		const igdbResp = await fetch("https://api.igdb.com/v4/games", {
			method: "POST",
			headers: {
				"Client-ID": process.env.IGDB_CLIENT_ID,
				Authorization: `Bearer ${tokenData.access_token}`,
				Accept: "application/json",
				"Content-Type": "text/plain",
			},
			body: `search "${sanitizedQuery}"; fields id,name,first_release_date,genres.name,platforms.name,involved_companies.company.name; limit 5;`,
		});

		if (!igdbResp.ok) throw new Error(`IGDB API error: ${igdbResp.status}`);
		const igdbData = await igdbResp.json();

		return igdbData.map((item) => ({
			id: String(item.id),
			nombre: item.name,
			fecha: item.first_release_date
				? new Date(item.first_release_date * 1000).getFullYear()
				: null,
			generos: item.genres?.map((g) => g.name) || [],
			plataformas: item.platforms?.map((p) => p.name) || [],
			creador: item.involved_companies?.[0]?.company?.name,
		}));
	} catch (error) {
		console.error(`Error searching IGDB for "${query}":`, error);
		return [];
	}
};

const findBestMatch = (sheetRow, searchResults, isGame = false) => {
	const sheetNombreCompleto = sheetRow[1];
	const sheetNombrePrincipal = normalizeText(
		extractMainName(sheetNombreCompleto),
	);
	const sheetNombreAlt = extractAlternateName(sheetNombreCompleto);
	const sheetNombreAltNorm = sheetNombreAlt
		? normalizeText(sheetNombreAlt)
		: null;

	const sheetFecha = sheetRow[14];
	const sheetGeneros = sheetRow[11]
		? String(sheetRow[11])
				.split(",")
				.map((g) => g.trim())
		: [];
	const sheetCreador = normalizeText(sheetRow[15]);
	const sheetTipo = normalizeText(sheetRow[3]);

	for (const result of searchResults) {
		const resultNombre = normalizeText(result.nombre);

		const nombreMatch =
			resultNombre === sheetNombrePrincipal ||
			(sheetNombreAltNorm && resultNombre === sheetNombreAltNorm) ||
			resultNombre.includes(sheetNombrePrincipal) ||
			sheetNombrePrincipal.includes(resultNombre) ||
			(sheetNombreAltNorm && resultNombre.includes(sheetNombreAltNorm));

		if (!nombreMatch) continue;

		if (isGame) {
			const generosMatch = compareArrays(
				sheetGeneros,
				result.generos || [],
			);
			const creadorMatch =
				sheetCreador && result.creador
					? normalizeText(result.creador).includes(sheetCreador) ||
						sheetCreador.includes(normalizeText(result.creador))
					: true;

			if (generosMatch || creadorMatch) {
				return result;
			}
		} else {
			let fechaMatch = true;
			if (sheetFecha && String(sheetFecha).trim() && result.fecha) {
				const sheetYear = String(sheetFecha).match(/\d{4}/)?.[0];
				const resultYear = String(result.fecha).match(/\d{4}/)?.[0];
				fechaMatch = sheetYear === resultYear;
			}

			let tipoMatch = true;
			if (sheetTipo && result.tipo) {
				tipoMatch =
					((sheetTipo.includes("pelicula") ||
						sheetTipo.includes("movie")) &&
						result.tipo === "movie") ||
					((sheetTipo.includes("serie") ||
						sheetTipo.includes("tv")) &&
						result.tipo === "tv");
			}

			let generosMatch = true;
			if (
				sheetGeneros.length > 0 &&
				result.generos &&
				result.generos.length > 0
			) {
				generosMatch = compareArrays(sheetGeneros, result.generos);
			}

			console.log(
				`	  Checking: fecha=${fechaMatch}, tipo=${tipoMatch}, generos=${generosMatch}`,
			);

			if (fechaMatch || tipoMatch || generosMatch) {
				return result;
			}
		}
	}

	return null;
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { sheetName, dryRun = true } = req.body;

	if (!sheetName || !["Pelis New", "Juegos New"].includes(sheetName)) {
		return res.status(400).json({
			error: "Invalid sheetName. Must be 'Pelis New' or 'Juegos New'",
		});
	}

	const sheetId = process.env.GOOGLE_SHEET_ID;
	if (!sheetId) {
		return res.status(500).json({ error: "Google Sheet ID missing" });
	}

	const isGame = sheetName === "Juegos New";

	try {
		console.log(
			`Starting ${dryRun ? "dry run" : "update"} for ${sheetName}...`,
		);

		const result = await getValues(sheetId, `${sheetName}!A2:R`);
		const rows = result?.values || [];

		console.log(`Found ${rows.length} total rows in ${sheetName}`);

		const rowsWithoutId = rows
			.map((row, index) => ({ row, rowIndex: index + 2 }))
			.filter(({ row }) => !row[0] || String(row[0]).trim() === "");

		console.log(`Found ${rowsWithoutId.length} rows without ID`);

		const updates = [];
		const errors = [];

		for (const { row, rowIndex } of rowsWithoutId) {
			const nombre = row[1];
			if (!nombre || String(nombre).trim() === "") {
				errors.push({ row: rowIndex, error: "No name found" });
				continue;
			}

			const nombreParaBuscar = extractMainName(nombre);
			console.log(
				`Processing row ${rowIndex}: "${nombre}" -> search: "${nombreParaBuscar}"`,
			);

			try {
				const searchResults = isGame
					? await searchIGDB(nombreParaBuscar)
					: await searchTMDB(nombreParaBuscar);

				if (searchResults.length === 0) {
					errors.push({
						row: rowIndex,
						nombre,
						error: "No search results found",
					});
					console.log(
						`  No search results found for "${nombreParaBuscar}"`,
					);
					continue;
				}

				console.log(`  Found ${searchResults.length} search results:`);
				searchResults.forEach((result, i) => {
					console.log(
						`    ${i + 1}. ${result.nombre} (${result.fecha}) [${result.tipo}] - Genres: ${JSON.stringify(result.generos)}`,
					);
				});

				const match = findBestMatch(row, searchResults, isGame);

				if (match) {
					console.log(
						`  ✓ Match found: ${match.nombre} (ID: ${match.id})`,
					);
					updates.push({
						rowIndex,
						nombre,
						foundId: match.id,
						match: {
							nombre: match.nombre,
							fecha: match.fecha,
							generos: match.generos,
							creador: match.creador,
						},
					});

					if (!dryRun) {
						await updateValues(
							sheetId,
							`${sheetName}!A${rowIndex}`,
							[[match.id]],
						);
						console.log(
							`  Updated row ${rowIndex} with ID: ${match.id}`,
						);
					}
				} else {
					const errorMsg =
						"No matching results found based on comparison criteria";
					console.log(`  ✗ ${errorMsg}`);
					console.log(
						`  Sheet data: nombre="${extractMainName(nombre)}", fecha="${row[14]}", generos="${row[11]}", tipo="${row[3]}"`,
					);
					errors.push({
						row: rowIndex,
						nombre,
						error: errorMsg,
						searchResults: searchResults.slice(0, 3).map((r) => ({
							nombre: r.nombre,
							fecha: r.fecha,
							generos: r.generos,
						})),
					});
				}

				await sleep(200);
			} catch (error) {
				errors.push({ row: rowIndex, nombre, error: error.message });
			}
		}

		const response = {
			success: true,
			dryRun,
			sheetName,
			totalRows: rows.length,
			rowsWithoutId: rowsWithoutId.length,
			updatesFound: updates.length,
			errors: errors.length,
			updates,
			errors: errors.slice(0, 10),
		};

		console.log(
			`Completed ${dryRun ? "dry run" : "update"}: ${updates.length} updates, ${errors.length} errors`,
		);

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error in update-missing-ids:", error);
		return res.status(500).json({ error: error.message });
	}
}

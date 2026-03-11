import { appendValues, getValues } from "../lib/sheets-client.js";
import { requireAuth } from "../lib/auth-middleware.js";

// Limpia texto para CSV
const cleanTextForCSV = (text) => {
	if (!text) return "";
	return text.replace(/[\r\n]+/g, " ").trim();
};

const normalizeText = (value) =>
	String(value || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\s*\[[^\]]*\]$/, "")
		.trim();

const normalizeMediaType = (value) => {
	const v = normalizeText(value);
	if (v === "movie" || v === "pelicula") return "pelicula";
	if (v === "tv" || v === "serie") return "serie";
	return v;
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const authResult = await requireAuth(req, res);
	if (authResult.error) {
		return res.status(authResult.status).json({ error: authResult.error });
	}

	const authenticatedUserId = authResult.userId;

	const { item, comment, tipo } = req.body;
	if (!item) return res.status(400).json({ error: "Missing data" });

	const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
	const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const sheetId = process.env.GOOGLE_SHEET_ID;
	if (!privateKey || !email || !sheetId) {
		return res.status(500).json({ error: "Google credentials missing" });
	}

	// Using sheets-client.js (appendValues) for lightweight Sheets REST calls

	let sheetName;
	const isPelis =
		item.tipo &&
		(item.tipo.toLowerCase() === "pelicula" ||
			item.tipo.toLowerCase() === "serie");
	if (isPelis) sheetName = "Pelis New";
	else sheetName = "Juegos New";
	const range = `${sheetName}!A1`;

	try {
		const existing = await getValues(sheetId, `${sheetName}!A2:D`);
		const rows = Array.isArray(existing?.values) ? existing.values : [];

		const incomingId = normalizeText(item.id);
		const incomingName = normalizeText(item.nombre || item.title || "");
		const incomingMediaType = normalizeMediaType(item.tipo || tipo || "");

		const duplicate = rows.some((row) => {
			const rowId = normalizeText(row?.[0] || "");
			const rowName = normalizeText(row?.[1] || "");
			const rowMediaType = normalizeMediaType(row?.[3] || "");
			const idMatch = incomingId && rowId && incomingId === rowId;
			const nameMatch =
				incomingName && rowName && incomingName === rowName;

			if (!(idMatch || nameMatch)) return false;
			if (!isPelis) return true;
			if (!incomingMediaType || !rowMediaType) return true;
			return incomingMediaType === rowMediaType;
		});

		if (duplicate) {
			return res.status(409).json({
				error: "Esa recomendación ya existe...",
				duplicate: true,
			});
		}

		await appendValues(sheetId, range, [
			[
				item.id || "",
				cleanTextForCSV(item.nombre || item.title || ""),
				"Recomendacion",
				item.tipo || tipo || "",
				"",
				item.url || "",
				item.caratula || "",
				item.imagen || "",
				item.duracion || "",
				"",
				item.trailer || "",
				item.generos
					? Array.isArray(item.generos)
						? item.generos.join(",")
						: item.generos
					: "",
				cleanTextForCSV(item.resumen || ""),
				item.fecha_salida || item.raw?.fecha_salida || "",
				item.nota_global || "",
				item.creador || "",
				authenticatedUserId,
				cleanTextForCSV(comment || ""),
			],
		]);
		res.json({ success: true });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
}

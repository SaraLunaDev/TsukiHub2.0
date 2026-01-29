import { appendValues } from "./sheets-client.js";
import { requireAuth } from "./auth-middleware.js";

// Limpia texto para CSV
const cleanTextForCSV = (text) => {
	if (!text) return "";
	return text.replace(/[\r\n]+/g, " ").trim();
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

	let range;
	if (
		item.tipo &&
		(item.tipo.toLowerCase() === "pelicula" ||
			item.tipo.toLowerCase() === "serie")
	) {
		range = "Pelis New!A1";
	} else {
		range = "Juegos New!A1";
	}

	try {
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

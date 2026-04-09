import { appendValues, getValues } from "../lib/sheets-client.js";
import { requireAuth } from "../lib/auth-middleware.js";
import { isAdmin } from "../lib/utils/jwt-utils.js";

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

const getItemTipo = (itemTipo, requestTipo) => {
	const t = normalizeText(itemTipo || requestTipo || "");
	if (
		t === "pelicula" ||
		t === "pelicula" ||
		t === "movie" ||
		t === "tv" ||
		t === "serie"
	)
		return "Pelicula";
	return "Juego";
};

const getItemPlataforma = (item) => {
	if (Array.isArray(item.tipo)) return item.tipo.join(", ");
	const t = normalizeText(item.tipo || "");
	if (t === "tv" || t === "serie") return "Serie";
	if (t === "movie" || t === "pelicula") return "Pelicula";
	return item.tipo || "";
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const authResult = await requireAuth(req, res);
	if (authResult.error) {
		return res.status(authResult.status).json({ error: authResult.error });
	}

	const { username, userId: authenticatedUserId } = authResult;
	const allowDuplicate = isAdmin(username);

	const { item, comment, tipo } = req.body;
	if (!item) return res.status(400).json({ error: "Missing data" });

	const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
	const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const sheetId = process.env.GOOGLE_SHEET_ID;
	if (!privateKey || !email || !sheetId) {
		return res.status(500).json({ error: "Google credentials missing" });
	}

	const itemTipo = getItemTipo(item.tipo, tipo);

	try {
		const existing = await getValues(sheetId, `DB_Items!A2:C`);
		const rows = Array.isArray(existing?.values) ? existing.values : [];

		const incomingId = normalizeText(item.id);
		const incomingName = normalizeText(item.nombre || item.title || "");

		const duplicate = rows.some((row) => {
			const rowTipo = normalizeText(row?.[0] || "");
			const rowId = normalizeText(row?.[1] || "");
			const rowName = normalizeText(row?.[2] || "");
			const idMatch = incomingId && rowId && incomingId === rowId;
			const nameMatch =
				incomingName && rowName && incomingName === rowName;
			if (!(idMatch || nameMatch)) return false;
			if (itemTipo === "Juego") {
				return rowTipo === "juego";
			}
			return rowTipo === "pelicula";
		});

		if (duplicate && !allowDuplicate) {
			return res.status(409).json({
				error: "Esa recomendación ya existe...",
				duplicate: true,
			});
		}

		const now = new Date();
		const dd = String(now.getDate()).padStart(2, "0");
		const mm = String(now.getMonth() + 1).padStart(2, "0");
		const yyyy = now.getFullYear();
		const hh = String(now.getHours()).padStart(2, "0");
		const min = String(now.getMinutes()).padStart(2, "0");
		const ss = String(now.getSeconds()).padStart(2, "0");
		const recommendedDate = `${dd}/${mm}/${yyyy}`;
		const ts = `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;

		const plataforma = getItemPlataforma(item);

		await appendValues(sheetId, "DB_Items!A1", [
			[
				itemTipo,
				item.id || "",
				cleanTextForCSV(item.nombre || item.title || ""),
				"Recomendacion",
				plataforma,
				recommendedDate,
				item.duracion || "",
				"",
				item.url || "",
				item.caratula || "",
				item.imagen || "",
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
				ts,
				ts,
				"",
			],
		]);

		if (comment) {
			await appendValues(sheetId, "DB_Comentarios!A1", [
				[
					itemTipo,
					item.id || "",
					cleanTextForCSV(item.nombre || item.title || ""),
					authenticatedUserId,
					cleanTextForCSV(comment),
					ts,
					ts,
					"",
				],
			]);
		}

		res.json({ success: true });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
}

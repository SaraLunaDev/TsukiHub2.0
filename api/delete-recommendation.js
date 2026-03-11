import { getValues, deleteRows } from "../lib/sheets-client.js";
import { requireAuth } from "../lib/auth-middleware.js";
import { getUserLists } from "../lib/utils/jwt-utils.js";

export default async function handler(req, res) {
	if (req.method !== "DELETE") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const authResult = await requireAuth(req, res);
	if (authResult.error) {
		return res.status(authResult.status).json({ error: authResult.error });
	}

	const authenticatedUserId = authResult.userId;
	const authenticatedUsername = authResult.username;

	const { adminUsers } = getUserLists();
	const isAdmin = adminUsers.includes(authenticatedUsername.toLowerCase());

	const { itemId, tipoSheet } = req.body;
	if (!itemId || !tipoSheet) {
		return res.status(400).json({ error: "Missing data" });
	}

	const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
	const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const sheetId = process.env.GOOGLE_SHEET_ID;
	if (!privateKey || !email || !sheetId) {
		return res.status(500).json({ error: "Google credentials missing" });
	}

	let sheetName;
	if (tipoSheet === "juegos") {
		sheetName = "Juegos New";
	} else {
		sheetName = "Pelis New";
	}

	try {
		const existing = await getValues(sheetId, `${sheetName}!A:Q`);
		const rows = Array.isArray(existing?.values) ? existing.values : [];

		let rowToDelete = -1;
		for (let i = 1; i < rows.length; i++) {
			const row = rows[i];
			const rowId = String(row?.[0] || "").trim();
			const rowUsuario = String(row?.[16] || "").trim();
			const rowEstado = String(row?.[2] || "").trim();

			if (
				String(itemId).trim() === rowId &&
				rowEstado.toLowerCase() === "recomendacion" &&
				(isAdmin || rowUsuario === String(authenticatedUserId).trim())
			) {
				rowToDelete = i + 1;
				break;
			}
		}

		if (rowToDelete === -1) {
			return res.status(404).json({
				error: "Recomendación no encontrada o no tienes permisos para eliminarla",
			});
		}

		const rowIndex0Based = rowToDelete - 1;
		await deleteRows(
			sheetId,
			sheetName,
			rowIndex0Based,
			rowIndex0Based + 1,
		);

		res.json({ success: true });
	} catch (e) {
		console.error("Error deleting recommendation:", e);
		res.status(500).json({ error: e.message });
	}
}

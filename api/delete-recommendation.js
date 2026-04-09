import { getValues, updateValues } from "../lib/sheets-client.js";
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
		const sheets = ["DB_Items"];
		let foundSheet = null;
		let itemRowIndex = -1;

		for (const sheetName of sheets) {
			try {
				const sheetData = await getValues(sheetId, `${sheetName}!A:U`);
				if (!sheetData || !sheetData.values) continue;

				const headers = sheetData.values[0];
				const rows = sheetData.values.slice(1);

				itemRowIndex = rows.findIndex((row) => {
					const rowId = String(row?.[1] || "").trim();
					const rowEstado = String(row?.[3] || "").trim();
					const rowUsuario = String(row?.[17] || "").trim();
					const rowEliminado = String(row?.[20] || "").trim();
					return (
						String(itemId).trim() === rowId &&
						rowEstado.toLowerCase() === "recomendacion" &&
						rowEliminado === "" &&
						(isAdmin ||
							rowUsuario === String(authenticatedUserId).trim())
					);
				});

				if (itemRowIndex !== -1) {
					foundSheet = sheetName;
					break;
				}
			} catch (error) {
				console.log(`Error checking ${sheetName}:`, error.message);
				continue;
			}
		}

		if (!foundSheet || itemRowIndex === -1) {
			return res.status(404).json({
				error: "Recomendación no encontrada o no tienes permisos para eliminarla",
			});
		}

		const rowIndexReal = itemRowIndex + 2;
		const now = new Date();
		const pad = (n) => String(n).padStart(2, "0");
		const ts = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
		await updateValues(
			sheetId,
			`${foundSheet}!T${rowIndexReal}:U${rowIndexReal}`,
			[[ts, ts]],
		);

		res.json({ success: true });
	} catch (e) {
		console.error("Error deleting recommendation:", e);
		res.status(500).json({ error: e.message });
	}
}

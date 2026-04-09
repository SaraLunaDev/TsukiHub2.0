import { appendValues, getValues, updateValues } from "../lib/sheets-client.js";
import { requireAuth } from "../lib/auth-middleware.js";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const authResult = await requireAuth(req, res);
	if (authResult.error) {
		return res.status(authResult.status).json({ error: authResult.error });
	}

	const { userId } = authResult;
	const { tipo, id, nombre, action } = req.body;
	if (!tipo || !id || !action) {
		return res.status(400).json({ error: "Missing vote data or action" });
	}

	const sheetId = process.env.GOOGLE_SHEET_ID;
	if (!sheetId) {
		return res.status(500).json({ error: "Google Sheet ID missing" });
	}

	try {
		const existing = await getValues(sheetId, "DB_Votos!A:E");
		const rows = Array.isArray(existing?.values) ? existing.values : [];
		const dataRows = rows.slice(1);
		const matchIndexes = [];
		dataRows.forEach((row, idx) => {
			const rowTipo = String(row[0] || "").toLowerCase();
			const rowId = String(row[1] || "");
			const rowUser = String(row[3] || "");
			const rowActivo = String(row[4] || "").toUpperCase();
			if (
				rowActivo === "TRUE" &&
				rowTipo === String(tipo).toLowerCase() &&
				rowId === String(id) &&
				rowUser === String(userId)
			) {
				matchIndexes.push(idx + 2);
			}
		});

		if (action === "add") {
			if (matchIndexes.length > 0) {
				return res
					.status(409)
					.json({ success: false, error: "User already voted" });
			}
			const now = new Date();
			const pad = (n) => String(n).padStart(2, "0");
			const ts = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
			await appendValues(sheetId, "DB_Votos!A:H", [
				[tipo, id, nombre || "", userId, "TRUE", ts, ts, ""],
			]);
			return res.status(200).json({ success: true });
		} else if (action === "remove") {
			if (matchIndexes.length === 0) {
				return res
					.status(404)
					.json({ success: false, error: "Vote not found" });
			}
			const now = new Date();
			const pad = (n) => String(n).padStart(2, "0");
			const ts = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
			for (const rowNum of matchIndexes) {
				await updateValues(sheetId, `DB_Votos!E${rowNum}:H${rowNum}`, [
					["FALSE", rows[rowNum - 1]?.[5] || ts, ts, ts],
				]);
			}
			return res.status(200).json({ success: true });
		} else {
			return res.status(400).json({ error: "Invalid action" });
		}
	} catch (error) {
		console.error("Error modifying vote:", error);
		return res.status(500).json({
			error: "Failed to modify vote",
			details: error.message,
		});
	}
}

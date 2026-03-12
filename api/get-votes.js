import { getValues } from "../lib/sheets-client.js";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { tipo, id, userId } = req.query;
	if (!tipo) {
		return res
			.status(400)
			.json({ error: "`tipo` query parameter is required" });
	}

	const sheetId = process.env.GOOGLE_SHEET_ID;
	if (!sheetId) {
		return res.status(500).json({ error: "Google Sheet ID missing" });
	}

	try {
		const sheetData = await getValues(sheetId, `Votos!A:D`);
		const rows = Array.isArray(sheetData?.values) ? sheetData.values : [];

		const dataRows = rows.slice(1);

		const normalizedTipo = String(tipo).toLowerCase();
		const includeUser = userId != null && userId !== "";
		let userVotedIds = includeUser ? new Set() : null;

		if (id) {
			let count = 0;
			let hasVoted = false;
			dataRows.forEach((row) => {
				const rowTipo = String(row[0] || "").toLowerCase();
				const rowId = String(row[1] || "");
				if (rowTipo === normalizedTipo && rowId === String(id)) {
					count++;
					if (
						includeUser &&
						String(row[3] || "") === String(userId)
					) {
						hasVoted = true;
					}
				}
			});
			return res.status(200).json({ success: true, count, hasVoted });
		} else {
			const counts = {};
			dataRows.forEach((row) => {
				const rowTipo = String(row[0] || "").toLowerCase();
				if (rowTipo !== normalizedTipo) return;
				const rowId = String(row[1] || "");
				if (rowId) {
					counts[rowId] = (counts[rowId] || 0) + 1;
					if (
						includeUser &&
						String(row[3] || "") === String(userId)
					) {
						userVotedIds.add(rowId);
					}
				}
			});
			const result = { success: true, counts };
			if (includeUser) result.userVotedIds = Array.from(userVotedIds);
			return res.status(200).json(result);
		}
	} catch (error) {
		console.error("Error fetching votes:", error);
		return res.status(500).json({
			error: "Failed to retrieve votes",
			details: error.message,
		});
	}
}

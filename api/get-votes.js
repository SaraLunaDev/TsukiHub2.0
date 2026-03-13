import { getValues } from "../lib/sheets-client.js";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { tipo, id, userId, raw } = req.query;
	if (!tipo) {
		return res
			.status(400)
			.json({ error: "`tipo` query parameter is required" });
	}

	const wantRaw = String(raw).toLowerCase() === "true";

	function parseCSVRow(row) {
		const result = [];
		let current = "";
		let inQuotes = false;
		for (let i = 0; i < row.length; i++) {
			const char = row[i];
			if (char === '"') {
				if (inQuotes && row[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === "," && !inQuotes) {
				result.push(current);
				current = "";
			} else {
				current += char;
			}
		}
		result.push(current);
		return result;
	}

	let rows = [];
	const votosUrl = process.env.VOTOS_SHEET_URL;
	if (votosUrl) {
		try {
			const resp = await fetch(votosUrl);
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const csvText = await resp.text();
			const lines = csvText.split("\n").filter((r) => r.trim());
			rows = lines.map(parseCSVRow);
		} catch (csvErr) {
			console.error("Error fetching votes CSV", csvErr);
			rows = [];
		}
	}

	if (rows.length === 0) {
		const sheetId = process.env.GOOGLE_SHEET_ID;
		if (!sheetId) {
			return res.status(500).json({ error: "Google Sheet ID missing" });
		}

		const sheetData = await getValues(sheetId, `Votos!A:D`);
		rows = Array.isArray(sheetData?.values) ? sheetData.values : [];
	}

	const headers = (rows[0] || []).map((h) => String(h).trim());
	const dataRows = rows.slice(1);

	try {
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
			const votes = wantRaw ? [] : null;
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
				if (wantRaw) {
					const obj = {};
					headers.forEach((h, i) => {
						obj[h] = row[i] || "";
					});
					votes.push(obj);
				}
			});
			const result = { success: true, counts };
			if (wantRaw) result.votes = votes;
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

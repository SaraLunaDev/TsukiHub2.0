import { requireAuth } from "../lib/auth-middleware.js";
import { getValues } from "../lib/sheets-client.js";
import { getUserLists } from "../lib/utils/jwt-utils.js";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const authResult = await requireAuth(req);
		if (authResult.error) {
			return res.status(401).json({ error: authResult.error });
		}

		const { adminUsers } = getUserLists();
		const isAdmin = adminUsers.includes(authResult.username.toLowerCase());
		if (!isAdmin) {
			return res.status(403).json({ error: "Admin access required" });
		}

		const { id, fecha } = req.query;
		if (!id) {
			return res.status(400).json({ error: "Item ID is required" });
		}

		const sheetId = process.env.GOOGLE_SHEET_ID;
		if (!sheetId) {
			return res.status(500).json({ error: "Google Sheet ID missing" });
		}

		const sheets = ["Juegos New", "Pelis New"];
		let itemData = null;
		let foundSheet = null;

		for (const sheetName of sheets) {
			try {
				const sheetData = await getValues(sheetId, `${sheetName}!A:Q`);
				if (!sheetData || !sheetData.values) continue;

				const headers = sheetData.values[0];
				const rows = sheetData.values.slice(1);

				let itemRowIndex = -1;
				if (fecha) {
					itemRowIndex = rows.findIndex(
						(row) =>
							row[0] === id &&
							row[headers.indexOf("Fecha")] ===
								decodeURIComponent(fecha),
					);
				} else {
					itemRowIndex = rows.findIndex((row) => row[0] === id);
				}

				if (itemRowIndex !== -1) {
					itemData = {};
					headers.forEach((header, index) => {
						itemData[header] = rows[itemRowIndex][index] || "";
					});

					itemData._rowNumber = itemRowIndex + 2;
					itemData._sheetName = sheetName;
					foundSheet = sheetName;
					break;
				}
			} catch (error) {
				console.log(`Error checking ${sheetName}:`, error.message);
				continue;
			}
		}

		if (!itemData) {
			return res.status(404).json({ error: "Item not found" });
		}

		res.status(200).json({
			success: true,
			data: itemData,
		});
	} catch (error) {
		console.error("Error fetching item:", error);
		res.status(500).json({
			error: "Failed to fetch item data",
			details: error.message,
		});
	}
}

import { requireAuth } from "../lib/auth-middleware.js";
import { getValues, updateValues } from "../lib/sheets-client.js";
import { getUserLists } from "../lib/utils/jwt-utils.js";

export default async function handler(req, res) {
	if (req.method !== "POST") {
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

		const { id, fecha, itemData } = req.body;

		if (!id || !itemData) {
			return res
				.status(400)
				.json({ error: "Item ID and data are required" });
		}

		const sheetId = process.env.GOOGLE_SHEET_ID;
		if (!sheetId) {
			return res.status(500).json({ error: "Google Sheet ID missing" });
		}

		const sheets = ["Juegos New", "Pelis New"];
		let foundSheet = null;
		let headers = null;
		let itemRowIndex = -1;
		let currentRow = null;

		for (const sheetName of sheets) {
			try {
				const sheetData = await getValues(sheetId, `${sheetName}!A:Q`);
				if (!sheetData || !sheetData.values) continue;

				headers = sheetData.values[0];
				const rows = sheetData.values.slice(1);

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
					currentRow = rows[itemRowIndex];
					foundSheet = sheetName;
					break;
				}
			} catch (error) {
				console.log(`Error checking ${sheetName}:`, error.message);
				continue;
			}
		}

		if (!foundSheet || itemRowIndex === -1) {
			return res.status(404).json({ error: "Item not found" });
		}

		const updatedRow = [];
		headers.forEach((header, index) => {
			updatedRow.push(itemData[header] || currentRow[index] || "");
		});

		const sheetRowNumber = itemRowIndex + 2;

		const range = `${foundSheet}!A${sheetRowNumber}:${String.fromCharCode(64 + headers.length)}${sheetRowNumber}`;

		await updateValues(sheetId, range, [updatedRow]);

		res.status(200).json({
			success: true,
			message: "Item updated successfully",
			updatedData: Object.fromEntries(
				headers.map((header, index) => [header, updatedRow[index]]),
			),
		});
	} catch (error) {
		console.error("Error updating item:", error);
		res.status(500).json({
			error: "Failed to update item",
			details: error.message,
		});
	}
}

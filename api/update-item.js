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

		const { id, fecha, usuario, itemData } = req.body;

		if (!id || !itemData) {
			return res
				.status(400)
				.json({ error: "Item ID and data are required" });
		}

		const sheetId = process.env.GOOGLE_SHEET_ID;
		if (!sheetId) {
			return res.status(500).json({ error: "Google Sheet ID missing" });
		}

		const sheets = ["DB_Items"];
		let foundSheet = null;
		let headers = null;
		let itemRowIndex = -1;
		let currentRow = null;

		for (const sheetName of sheets) {
			try {
				const sheetData = await getValues(sheetId, `${sheetName}!A:U`);
				if (!sheetData || !sheetData.values) continue;

				headers = sheetData.values[0];
				const rows = sheetData.values.slice(1);

				if (fecha) {
					const decodedFecha = decodeURIComponent(fecha);
					const decodedUsuario = usuario
						? decodeURIComponent(usuario)
						: null;
					const fechaIdx = headers.indexOf("fecha");
					const usuarioIdx = headers.indexOf("usuario_id");
					itemRowIndex = rows.findIndex(
						(row) =>
							row[1] === id &&
							row[fechaIdx] === decodedFecha &&
							(!decodedUsuario ||
								row[usuarioIdx] === decodedUsuario),
					);
				} else {
					itemRowIndex = rows.findIndex((row) => row[1] === id);
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
			if (header === "actualizado_en") {
				const now = new Date();
				const pad = (n) => String(n).padStart(2, "0");
				updatedRow.push(
					`${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
				);
			} else {
				updatedRow.push(itemData[header] ?? currentRow[index] ?? "");
			}
		});

		const sheetRowNumber = itemRowIndex + 2;
		const range = `${foundSheet}!A${sheetRowNumber}:${String.fromCharCode(64 + headers.length)}${sheetRowNumber}`;
		await updateValues(sheetId, range, [updatedRow]);

		if (itemData.comentario !== undefined) {
			try {
				const itemUserId =
					itemData.usuario_id ||
					currentRow[headers.indexOf("usuario_id")] ||
					"";
				const comentariosData = await getValues(
					sheetId,
					"DB_Comentarios!A:H",
				);
				const comentRows = Array.isArray(comentariosData?.values)
					? comentariosData.values
					: [];
				const dataRows = comentRows.slice(1);
				const comentRowIndex = dataRows.findIndex(
					(row) =>
						String(row[1] || "").trim() === String(id).trim() &&
						String(row[3] || "").trim() ===
							String(itemUserId).trim(),
				);
				const now = new Date();
				const pad = (n) => String(n).padStart(2, "0");
				const ts = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
				if (comentRowIndex !== -1) {
					const realRow = comentRowIndex + 2;
					await updateValues(
						sheetId,
						`DB_Comentarios!E${realRow}:G${realRow}`,
						[[itemData.comentario, ts, ""]],
					);
				} else if (itemData.comentario) {
					const itemTipo =
						itemData.tipo ||
						currentRow[headers.indexOf("tipo")] ||
						"";
					const itemNombre =
						itemData.nombre ||
						currentRow[headers.indexOf("nombre")] ||
						"";
					await appendValues(sheetId, "DB_Comentarios!A1", [
						[
							itemTipo,
							id,
							itemNombre,
							itemUserId,
							itemData.comentario,
							ts,
							ts,
							"",
						],
					]);
				}
			} catch (_) {}
		}

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

import { requireAuth } from "../lib/auth-middleware.js";
import { appendValues } from "../lib/sheets-client.js";
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

		const { itemData } = req.body;

		if (!itemData || !itemData.nombre) {
			return res
				.status(400)
				.json({ error: "Item data with nombre is required" });
		}

		const sheetId = process.env.GOOGLE_SHEET_ID;
		if (!sheetId) {
			return res.status(500).json({ error: "Google Sheet ID missing" });
		}

		const now = new Date();
		const pad = (n) => String(n).padStart(2, "0");
		const ts = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

		const tipo = itemData.tipo || "Juego";
		const estado = itemData.estado || "Planeado";

		await appendValues(sheetId, "DB_Items!A1", [
			[
				tipo,
				itemData.id || "",
				itemData.nombre || "",
				estado,
				itemData.plataforma || "",
				itemData.fecha || "",
				itemData.duracion || "",
				itemData.nota || "",
				itemData.youtube_url || "",
				itemData.caratula || "",
				itemData.imagen || "",
				itemData.trailer || "",
				itemData.generos || "",
				itemData.resumen || "",
				itemData.fecha_salida || "",
				itemData.nota_global || "",
				itemData.creador || "",
				itemData.usuario_id || authResult.userId || "",
				ts,
				ts,
				"",
			],
		]);

		if (itemData.comentario) {
			await appendValues(sheetId, "DB_Comentarios!A1", [
				[
					tipo,
					itemData.id || "",
					itemData.nombre || "",
					itemData.usuario_id || authResult.userId || "",
					itemData.comentario,
					ts,
					ts,
					"",
				],
			]);
		}

		res.status(200).json({
			success: true,
			message: "Item added successfully",
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

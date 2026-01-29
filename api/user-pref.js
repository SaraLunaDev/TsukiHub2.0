import { getValues, appendValues, updateValues } from "./sheets-client.js";
import { requireAuth } from "./auth-middleware.js";

/**
 * API: GET /api/user-pref
 *      - Returns the authenticated user's preferences (parsed JSON from the `pref` column)
 *
 *      POST /api/user-pref
 *      - Body: { pref: <object> }
 *      - Stores (or creates) a row in sheet 'User Pref' with columns [id, nombre, pref]
 *        pref column will contain JSON.stringify(pref)
 *
 * Security:
 * - Requires Twitch OAuth token (checked via requireAuth)
 * - Only reads/updates the row that matches the authenticated user's id
 */

export default async function handler(req, res) {
	if (req.method !== "GET" && req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	// Auth
	const authResult = await requireAuth(req, res);
	if (authResult.error) {
		return res.status(authResult.status).json({ error: authResult.error });
	}

	const { userId, username } = authResult;

	// Google Service Account credentials + Sheet ID
	const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
	const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const sheetId = process.env.GOOGLE_SHEET_ID;
	if (!privateKey || !email || !sheetId) {
		return res.status(500).json({ error: "Google credentials missing" });
	}

	// Using sheets-client.js for lightweight Sheets REST calls

	try {
		// Read all rows from 'User Pref' (A:C -> id, nombre, pref)
		const getRes = await getValues(sheetId, "User Pref!A:C");
		const rows = getRes.values || [];

		// Find row where column A exactly matches authenticated user id
		const rowIndex = rows.findIndex((r) => {
			if (!r || !r[0]) return false;
			// Normalize to string compare
			return String(r[0]) === String(userId);
		});

		if (req.method === "GET") {
			if (rowIndex === -1) {
				// No prefs yet for this user
				return res.status(200).json({ success: true, pref: {} });
			}

			const rawPref = rows[rowIndex][2] || "";
			try {
				const pref = rawPref ? JSON.parse(rawPref) : {};
				return res.status(200).json({ success: true, pref });
			} catch (err) {
				// Malformed JSON in sheet; return raw + empty pref to avoid crashing client
				return res
					.status(200)
					.json({ success: true, pref: {}, rawPref });
			}
		}

		// POST: update preferences
		if (req.method === "POST") {
			const pref = req.body?.pref;
			if (!pref) {
				return res
					.status(400)
					.json({ error: "Missing pref object in request body" });
			}

			const prefString = JSON.stringify(pref);

			if (rowIndex === -1) {
				// Append a new row [id, nombre, pref]
				await appendValues(sheetId, "User Pref!A:C", [
					[String(userId), username || "", prefString],
				]);
			} else {
				// Update existing user's pref cell (column C)
				// rows array is 0-based and corresponds to sheet rows starting at 1
				// so rowNumber = rowIndex + 1
				const rowNumber = rowIndex + 1;
				const updateRange = `User Pref!C${rowNumber}`;
				await updateValues(sheetId, updateRange, [[prefString]]);
			}

			return res.status(200).json({ success: true });
		}
	} catch (error) {
		console.error("user-pref error:", error);
		return res
			.status(500)
			.json({ error: error.message || "Internal server error" });
	}
}

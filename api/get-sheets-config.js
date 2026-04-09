export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		return res.status(200).json({
			version: "5.0.0",
			itemsSheetUrl: process.env.DB_ITEMS || "",
			usuariosSheetUrl: process.env.DB_USUARIOS || "",
			votosSheetUrl: process.env.DB_VOTOS || "",
			comentariosSheetUrl: process.env.DB_COMENTARIOS || "",
			pokedexSheetUrl: process.env.DB_POKEDEX || "",
			gachaSheetUrl: process.env.DB_GACHA || "",
			gachaCharSheetUrl: process.env.DB_GACHA_PERSONAJES || "",
			twitchClientId: process.env.TWITCH_CLIENT_ID || "",
			twitchRedirectUri: process.env.TWITCH_REDIRECT_URI || "",
		});
	} catch (error) {
		return res.status(500).json({ error: "Internal server error" });
	}
}

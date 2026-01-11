export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = {
      juegosSheetUrl: process.env.JUEGOS_SHEET_URL || "",
      pelisSheetUrl: process.env.PELIS_SHEET_URL || "",
      userdataSheetUrl: process.env.USERDATA_SHEET_URL || "",
      pokedexSheetUrl: process.env.POKEDEX_SHEET_URL || "",
      gachaSheetUrl: process.env.GACHA_SHEET_URL || "",
      twitchClientId: process.env.TWITCH_CLIENT_ID || "",
      twitchRedirectUri: process.env.TWITCH_REDIRECT_URI || "",
    };

    return res.status(200).json(config);
  } catch (error) {
    console.error("Error getting sheets config:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

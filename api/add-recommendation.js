import { google } from "googleapis";
import { requireAuth } from "./auth-middleware.js";

// Limpia texto para CSV
const cleanTextForCSV = (text) => {
  if (!text) return "";
  return text.replace(/[\r\n]+/g, " ").trim();
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = requireAuth(req, res);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { item, user, comment, tipo } = req.body;
  console.log("[add-recommendation] Datos recibidos:", {
    item,
    user,
    comment,
    tipo,
  });
  if (!item || !user) return res.status(400).json({ error: "Missing data" });

  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!privateKey || !email || !sheetId) {
    return res.status(500).json({ error: "Google credentials missing" });
  }

  const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
  });
  const sheets = google.sheets({ version: "v4", auth });

  let range;
  if (
    item.tipo &&
    (item.tipo.toLowerCase() === "pelicula" ||
      item.tipo.toLowerCase() === "serie")
  ) {
    range = "Pelis New!A1";
  } else {
    range = "Juegos New!A1";
  }

  try {
    await new Promise((resolve, reject) => {
      auth.authorize((err, tokens) => {
        if (err) return reject(err);
        resolve(tokens);
      });
    });
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            item.id || "",
            cleanTextForCSV(item.nombre || item.title || ""),
            "Recomendacion",
            item.tipo || tipo || "",
            "",
            item.url || "",
            item.caratula || "",
            item.imagen || "",
            item.duracion || "",
            "",
            item.trailer || "",
            item.generos
              ? Array.isArray(item.generos)
                ? item.generos.join(",")
                : item.generos
              : "",
            cleanTextForCSV(item.resumen || ""),
            item.fecha_salida || item.raw?.fecha_salida || "",
            item.nota_global || "",
            item.creador || "",
            user,
            cleanTextForCSV(comment || ""),
          ],
        ],
      },
    });
    console.log(
      "[add-recommendation] Respuesta de Google Sheets:",
      appendResponse.data
    );
    res.json({ success: true });
  } catch (e) {
    console.error("[add-recommendation] Error:", e);
    res.status(500).json({ error: e.message });
  }
}

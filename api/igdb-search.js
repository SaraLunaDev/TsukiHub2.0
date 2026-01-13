export default async function handler(req, res) {
  const fetch = (await import("node-fetch")).default;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const sanitizedQuery = String(query).replace(/"/g, '\\"').substring(0, 100);

  try {
    const tokenResp = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: "POST" }
    );
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: "No IGDB access_token", tokenData });
    }
    const igdbResp = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
        "Content-Type": "text/plain",
      },
      body: `search "${sanitizedQuery}"; fields id,name,cover.url,first_release_date,genres.name,platforms.name,summary,involved_companies.company.name,videos.*,total_rating,artworks; limit 10;`,
    });
    const igdbText = await igdbResp.text();
    if (igdbResp.status !== 200) {
      return res.status(500).json({
        error: "IGDB API error",
        status: igdbResp.status,
        body: igdbText,
      });
    }
    const igdbData = JSON.parse(igdbText);

    // Obtener artworks para todos los juegos encontrados
    let artworkMap = {};
    const allArtworkIds = igdbData
      .flatMap((game) => (Array.isArray(game.artworks) ? game.artworks : []))
      .filter(Boolean);
    if (allArtworkIds.length > 0) {
      const artworkResp = await fetch("https://api.igdb.com/v4/artworks", {
        method: "POST",
        headers: {
          "Client-ID": process.env.IGDB_CLIENT_ID,
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
          "Content-Type": "text/plain",
        },
        body: `where id = (${allArtworkIds.join(",")}); fields id,image_id;`,
      });
      if (artworkResp.ok) {
        const artworkData = await artworkResp.json();
        artworkMap = Object.fromEntries(
          artworkData.map((a) => [a.id, a.image_id])
        );
      }
    }
    const resultsWithTrailer = igdbData.map((game) => {
      let trailer = "";
      if (game.videos && Array.isArray(game.videos)) {
        const ytTrailer = game.videos.find(
          (v) => v.name && v.name.toLowerCase().includes("trailer")
        );
        if (ytTrailer) {
          trailer = `https://www.youtube.com/watch?v=${ytTrailer.video_id}`;
        } else if (game.videos.length > 0) {
          trailer = `https://www.youtube.com/watch?v=${game.videos[0].video_id}`;
        }
      }
      return { ...game, trailer };
    });
    const results = resultsWithTrailer.map((game) => {
      // Buscar artwork si existe
      let artworkUrl = "";
      if (
        game.artworks &&
        Array.isArray(game.artworks) &&
        game.artworks.length > 0
      ) {
        const firstId = game.artworks.find((id) => artworkMap[id]);
        if (firstId) {
          artworkUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${artworkMap[firstId]}.webp`;
        }
      }
      return {
        id: game.id,
        nombre:
          game.name &&
          game.alternative_names &&
          Array.isArray(game.alternative_names) &&
          game.alternative_names.length > 0
            ? `${game.name} [${game.alternative_names[0]}]`
            : game.name,
        estado: "Recomendacion",
        tipo: game.platforms ? game.platforms.map((p) => p.name) : [],
        fecha: game.first_release_date
          ? (() => {
              const d = new Date(game.first_release_date * 1000);
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const year = d.getFullYear();
              return `${day}/${month}/${year}`;
            })()
          : "",
        url: "",
        caratula: game.cover
          ? game.cover.url.replace("t_thumb", "t_cover_big")
          : "",
        imagen: artworkUrl,
        duracion: "",
        nota: "",
        trailer: (() => {
          if (game.videos && Array.isArray(game.videos)) {
            const esTrailer = game.videos.find(
              (v) =>
                v.name &&
                v.name.toLowerCase().includes("trailer") &&
                (v.language === "es" || v.language === "spa")
            );
            if (esTrailer)
              return `https://www.youtube.com/watch?v=${esTrailer.video_id}`;
            const enTrailer = game.videos.find(
              (v) =>
                v.name &&
                v.name.toLowerCase().includes("trailer") &&
                (v.language === "en" || v.language === "eng")
            );
            if (enTrailer)
              return `https://www.youtube.com/watch?v=${enTrailer.video_id}`;
            const anyTrailer = game.videos.find(
              (v) => v.name && v.name.toLowerCase().includes("trailer")
            );
            if (anyTrailer)
              return `https://www.youtube.com/watch?v=${anyTrailer.video_id}`;
            if (game.videos.length > 0) {
              return `https://www.youtube.com/watch?v=${game.videos[0].video_id}`;
            }
          }
          return "";
        })(),
        generos: game.genres ? game.genres.map((g) => g.name) : [],
        plataformas: [],
        resumen: game.summary || "",
        fecha_salida: game.first_release_date
          ? (() => {
              const d = new Date(game.first_release_date * 1000);
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const year = d.getFullYear();
              return `${day}/${month}/${year}`;
            })()
          : "",
        nota_global:
          typeof game.total_rating === "number"
            ? Number(game.total_rating.toFixed(1))
            : "",
        creador:
          game.involved_companies &&
          game.involved_companies[0] &&
          game.involved_companies[0].company
            ? game.involved_companies[0].company.name
            : "",
      };
    });
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

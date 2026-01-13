export default async function handler(req, res) {
  const fetch = (await import("node-fetch")).default;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { query, type = "multi" } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const validTypes = ["multi", "movie", "tv"];
  const sanitizedType = validTypes.includes(type) ? type : "multi";

  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB API key missing" });
    }

    const tmdbResp = await fetch(
      `https://api.themoviedb.org/3/search/${sanitizedType}?api_key=${apiKey}&query=${encodeURIComponent(
        query
      )}&language=es-ES&page=1`
    );
    if (!tmdbResp.ok) {
      return res
        .status(500)
        .json({ error: "TMDB API error", status: tmdbResp.status });
    }
    const tmdbData = await tmdbResp.json();
    const results = await Promise.all(
      tmdbData.results.slice(0, 10).map(async (item) => {
        const detailType =
          item.media_type || (type === "movie" ? "movie" : "tv");
        const detailUrl = `https://api.themoviedb.org/3/${detailType}/${item.id}?api_key=${apiKey}&language=es-ES&append_to_response=credits`;
        const videosUrl = `https://api.themoviedb.org/3/${detailType}/${item.id}/videos?api_key=${apiKey}&language=es-ES`;
        let detailData = {};
        let videosData = {};
        try {
          const detailResp = await fetch(detailUrl);
          if (detailResp.ok) detailData = await detailResp.json();
          const videosResp = await fetch(videosUrl);
          if (videosResp.ok) videosData = await videosResp.json();
        } catch (e) {}
        let trailer = "";
        let allTrailers = [];
        if (videosData.results && videosData.results.length > 0) {
          allTrailers = allTrailers.concat(
            videosData.results.filter(
              (v) => v.type === "Trailer" && v.site === "YouTube"
            )
          );
        }
        try {
          const videosUrlEN = `https://api.themoviedb.org/3/${detailType}/${item.id}/videos?api_key=${apiKey}&language=en-US`;
          const videosRespEN = await fetch(videosUrlEN);
          if (videosRespEN.ok) {
            const videosDataEN = await videosRespEN.json();
            if (videosDataEN.results && videosDataEN.results.length > 0) {
              allTrailers = allTrailers.concat(
                videosDataEN.results.filter(
                  (v) => v.type === "Trailer" && v.site === "YouTube"
                )
              );
            }
          }
        } catch {}
        const esTrailer = allTrailers.find(
          (v) => v.iso_639_1 === "es" || v.iso_639_1 === "spa"
        );
        const enTrailer = allTrailers.find(
          (v) => v.iso_639_1 === "en" || v.iso_639_1 === "eng"
        );
        const anyTrailer = allTrailers.length > 0 ? allTrailers[0] : null;
        if (esTrailer) {
          trailer = `https://www.youtube.com/watch?v=${esTrailer.key}`;
        } else if (enTrailer) {
          trailer = `https://www.youtube.com/watch?v=${enTrailer.key}`;
        } else if (anyTrailer) {
          trailer = `https://www.youtube.com/watch?v=${anyTrailer.key}`;
        }
        let creador = "";
        if (detailType === "movie" && detailData.credits) {
          const director = detailData.credits.crew?.find(
            (p) => p.job === "Director"
          );
          creador = director ? director.name : "";
        } else if (detailType === "tv" && detailData.created_by) {
          creador = detailData.created_by.map((c) => c.name).join(", ");
        }
        const generos = detailData.genres
          ? detailData.genres.map((g) => g.name)
          : [];
        const caratula = item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : "";
        const resumen = item.overview || detailData.overview || "";
        const fecha = item.release_date || item.first_air_date || "";
        let duracion = "";
        if (detailType === "movie" && detailData.runtime) {
          const h = Math.floor(detailData.runtime / 60);
          const m = detailData.runtime % 60;
          duracion = h > 0 ? `${h}h ${m}m` : `${m}m`;
        } else if (
          detailType === "tv" &&
          detailData.episode_run_time &&
          detailData.episode_run_time.length > 0
        ) {
          const avg = detailData.episode_run_time[0];
          const h = Math.floor(avg / 60);
          const m = avg % 60;
          duracion = h > 0 ? `${h}h ${m}m` : `${m}m`;
        }
        const nota_global = item.vote_average
          ? item.vote_average.toString()
          : "";
        return {
          id: item.id,
          nombre:
            item.title || item.name
              ? (item.title || item.name) +
                (item.original_title &&
                item.original_title !== (item.title || item.name)
                  ? ` [${item.original_title}]`
                  : "")
              : "",
          estado: "Recomendacion",
          tipo: detailType === "movie" ? "Pelicula" : "Serie",
          fecha: "",
          url: "",
          caratula,
          imagen: item.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
            : "",
          duracion,
          nota: "",
          trailer,
          generos,
          resumen,
          fecha_salida: fecha
            ? (() => {
                const d = new Date(fecha);
                if (isNaN(d)) return "";
                const day = String(d.getDate()).padStart(2, "0");
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const year = d.getFullYear();
                return `${day}/${month}/${year}`;
              })()
            : "",
          nota_global,
          creador,
        };
      })
    );
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

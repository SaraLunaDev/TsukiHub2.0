const fs = require("fs");
const path = require("path");

/**
 * API: GET /api/get-static-assets
 *
 * Returns:
 *  {
 *    voicesCount: number,
 *    soundsCount: number,
 *    voices: [{ name, url, id? }],
 *    sounds: [{ name, url, id? }]
 *  }
 *
 * Behavior:
 * - First tries to read a small manifest bundled with the function:
 *     api/static-assets-manifest.json
 *   (this is preferred because it's tiny and avoids scanning large directories)
 * - If not present, tries to read manifest files from build/static or public/static:
 *     voices-list.json and sounds-list.json
 * - If those don't exist, falls back to directory scan of static/voices and static/sounds
 *
 * Important: returned items include `id` when available (from manifest `id` field
 * or derived from filename prefix like `12_name.ext`).
 */

module.exports = async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		// __dirname is available in CommonJS

		const projectRoot = path.join(__dirname, "..");
		const staticDirPath = fs.existsSync(path.join(projectRoot, "build"))
			? path.join(projectRoot, "build")
			: path.join(projectRoot, "public");

		const deriveIdFromName = (str) => {
			if (!str) return undefined;
			const base = String(str).replace(/\.[^.]+$/, "");
			const parts = base.split("_");
			const n = parseInt(parts[0], 10);
			return Number.isFinite(n) ? n : undefined;
		};

		const normalizeEntry = (it, urlSegment) => {
			const fileRef = it.file || it.name || "";
			const name =
				it.name || (fileRef ? fileRef.replace(/\.[^.]+$/, "") : "");
			const rawId =
				typeof it.id !== "undefined" && it.id !== null
					? Number(it.id)
					: undefined;
			const derivedId =
				typeof rawId === "number" && Number.isFinite(rawId)
					? rawId
					: deriveIdFromName(fileRef);
			const id = Number.isFinite(derivedId) ? derivedId : undefined;
			return {
				name,
				url: `/static/${urlSegment}/${encodeURIComponent(fileRef)}`,
				...(typeof id !== "undefined" ? { id } : {}),
			};
		};

		const readManifest = (manifestName, urlSegment) => {
			const manifestPath = path.join(
				staticDirPath,
				"static",
				manifestName,
			);
			if (!fs.existsSync(manifestPath)) return null;
			try {
				const raw = fs.readFileSync(manifestPath, "utf8");
				const data = JSON.parse(raw);
				if (!Array.isArray(data)) {
					console.error(
						`[get-static-assets] manifest ${manifestPath} JSON is not an array`,
					);
					return null;
				}
				return data
					.filter((it) => it && (it.file || it.name))
					.map((it) => {
						try {
							return normalizeEntry(it, urlSegment);
						} catch (innerErr) {
							console.error(
								`[get-static-assets] invalid manifest entry in ${manifestPath}`,
								innerErr && innerErr.stack
									? innerErr.stack
									: innerErr,
							);
							return null;
						}
					})
					.filter(Boolean);
			} catch (e) {
				console.error(
					`[get-static-assets] failed to read/parse manifest ${manifestPath}:`,
					e && e.stack ? e.stack : e,
				);
				// parse/read error -> fall back to directory scan
				return null;
			}
		};

		const readDirList = (dir, urlSegment) => {
			try {
				if (!fs.existsSync(dir)) return [];
				return fs
					.readdirSync(dir, { withFileTypes: true })
					.filter((dirent) => dirent.isFile())
					.map((dirent) => dirent.name)
					.filter((name) => !name.startsWith("."))
					.map((name) => {
						try {
							const id = deriveIdFromName(name);
							return {
								name,
								url: `/static/${urlSegment}/${encodeURIComponent(name)}`,
								...(typeof id !== "undefined" ? { id } : {}),
							};
						} catch (innerErr) {
							console.error(
								`[get-static-assets] failed to process file ${name} in ${dir}:`,
								innerErr && innerErr.stack
									? innerErr.stack
									: innerErr,
							);
							return null;
						}
					})
					.filter(Boolean);
			} catch (e) {
				console.error(
					`[get-static-assets] failed to read dir ${dir}:`,
					e && e.stack ? e.stack : e,
				);
				return [];
			}
		};

		// 1) Try local bundled manifest (inside /api). This is the preferred and safest option.
		try {
			const localManifestPath = path.join(
				__dirname,
				"static-assets-manifest.json",
			);
			if (fs.existsSync(localManifestPath)) {
				const raw = fs.readFileSync(localManifestPath, "utf8");
				const manifest = JSON.parse(raw);

				const voices = Array.isArray(manifest.voices)
					? manifest.voices
							.filter((it) => it && (it.file || it.name))
							.map((it) => {
								try {
									return normalizeEntry(it, "voices");
								} catch (innerErr) {
									console.error(
										"[get-static-assets] invalid local manifest voice entry:",
										innerErr && innerErr.stack
											? innerErr.stack
											: innerErr,
									);
									return null;
								}
							})
							.filter(Boolean)
					: [];
				const sounds = Array.isArray(manifest.sounds)
					? manifest.sounds
							.filter((it) => it && (it.file || it.name))
							.map((it) => {
								try {
									return normalizeEntry(it, "sounds");
								} catch (innerErr) {
									console.error(
										"[get-static-assets] invalid local manifest sound entry:",
										innerErr && innerErr.stack
											? innerErr.stack
											: innerErr,
									);
									return null;
								}
							})
							.filter(Boolean)
					: [];

				return res.status(200).json({
					voicesCount: voices.length,
					soundsCount: sounds.length,
					voices,
					sounds,
				});
			}
		} catch (e) {
			console.error(
				"[get-static-assets] local manifest parse error:",
				e && e.stack ? e.stack : e,
			);
			// If parsing fails, continue to fallbacks below
		}

		// 2) Try official manifests in build/public static dir
		const voices =
			readManifest("voices-list.json", "voices") ||
			readDirList(path.join(staticDirPath, "static", "voices"), "voices");
		const sounds =
			readManifest("sounds-list.json", "sounds") ||
			readDirList(path.join(staticDirPath, "static", "sounds"), "sounds");

		return res.status(200).json({
			voicesCount: voices.length,
			soundsCount: sounds.length,
			voices,
			sounds,
		});
	} catch (err) {
		console.error(
			"[get-static-assets] Unexpected error:",
			err && err.stack ? err.stack : err,
		);

		// Fallback: try to return bundled local manifest (api/static-assets-manifest.json)
		try {
			const fallbackPath = path.join(
				__dirname,
				"static-assets-manifest.json",
			);

			if (fs.existsSync(fallbackPath)) {
				const raw = fs.readFileSync(fallbackPath, "utf8");
				const manifest = JSON.parse(raw);

				const deriveIdFromName = (str) => {
					if (!str) return undefined;
					const base = String(str).replace(/\.[^/.]+$/, "");
					const parts = base.split("_");
					const n = parseInt(parts[0], 10);
					return Number.isFinite(n) ? n : undefined;
				};

				const normalizeFallback = (it, urlSegment) => {
					const fileRef = it.file || it.name || "";
					const name =
						it.name ||
						(fileRef ? fileRef.replace(/\.[^.]+$/, "") : "");
					const rawId =
						typeof it.id !== "undefined" && it.id !== null
							? Number(it.id)
							: undefined;
					const derivedId =
						typeof rawId === "number" && Number.isFinite(rawId)
							? rawId
							: deriveIdFromName(fileRef);
					const id = Number.isFinite(derivedId)
						? derivedId
						: undefined;
					return {
						name,
						url: `/static/${urlSegment}/${encodeURIComponent(
							fileRef,
						)}`,
						...(typeof id !== "undefined" ? { id } : {}),
					};
				};

				const voices = Array.isArray(manifest.voices)
					? manifest.voices
							.filter((it) => it && (it.file || it.name))
							.map((it) => normalizeFallback(it, "voices"))
							.filter(Boolean)
					: [];
				const sounds = Array.isArray(manifest.sounds)
					? manifest.sounds
							.filter((it) => it && (it.file || it.name))
							.map((it) => normalizeFallback(it, "sounds"))
							.filter(Boolean)
					: [];

				return res.status(200).json({
					voicesCount: voices.length,
					soundsCount: sounds.length,
					voices,
					sounds,
					fallback: "bundled-manifest",
				});
			}
		} catch (fallbackErr) {
			console.error(
				"[get-static-assets] fallback manifest error",
				fallbackErr && fallbackErr.stack
					? fallbackErr.stack
					: fallbackErr,
			);
		}

		return res.status(500).json({
			error: "Internal server error",
			message: err.message || String(err),
		});
	}
};

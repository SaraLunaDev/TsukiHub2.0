import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);

		const projectRoot = path.join(__dirname, "..");
		const staticDirPath = fs.existsSync(path.join(projectRoot, "build"))
			? path.join(projectRoot, "build")
			: path.join(projectRoot, "public");

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
				if (!Array.isArray(data)) return null;
				return data
					.filter((it) => it && (it.file || it.name))
					.map((it) => ({
						name:
							it.name ||
							(it.file ? it.file.replace(/\.[^.]+$/, "") : ""),
						url: `/static/${urlSegment}/${encodeURIComponent(it.file || it.name)}`,
					}));
			} catch (e) {
				// On parse/read error, fall back to directory scan
				return null;
			}
		};

		const readDirList = (dir, urlSegment) => {
			if (!fs.existsSync(dir)) return [];
			return fs
				.readdirSync(dir, { withFileTypes: true })
				.filter((dirent) => dirent.isFile())
				.map((dirent) => dirent.name)
				.filter((name) => !name.startsWith("."))
				.map((name) => ({
					name,
					url: `/static/${urlSegment}/${encodeURIComponent(name)}`,
				}));
		};

		// Prefer a small local manifest shipped with the function bundle to avoid
		// scanning large directories at runtime (and to handle environments where
		// the public/build tree is not available to functions).
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
							.map((it) => ({
								name:
									it.name ||
									(it.file
										? it.file.replace(/\.[^.]+$/, "")
										: ""),
								url: `/static/voices/${encodeURIComponent(it.file || it.name)}`,
							}))
					: [];
				const sounds = Array.isArray(manifest.sounds)
					? manifest.sounds
							.filter((it) => it && (it.file || it.name))
							.map((it) => ({
								name:
									it.name ||
									(it.file
										? it.file.replace(/\.[^.]+$/, "")
										: ""),
								url: `/static/sounds/${encodeURIComponent(it.file || it.name)}`,
							}))
					: [];

				return res.status(200).json({
					voicesCount: voices.length,
					soundsCount: sounds.length,
					voices,
					sounds,
				});
			}
		} catch (e) {
			// If manifest parsing fails, fall back to directory scanning below.
		}

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
		return res
			.status(500)
			.json({ error: "Internal server error", message: err.message });
	}
}

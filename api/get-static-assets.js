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

		const voicesDir = path.join(staticDirPath, "static", "voices");
		const soundsDir = path.join(staticDirPath, "static", "sounds");

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

		const voices = readDirList(voicesDir, "voices");
		const sounds = readDirList(soundsDir, "sounds");

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

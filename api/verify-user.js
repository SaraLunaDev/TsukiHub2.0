import { requireAuth } from "./auth-middleware.js";
import { createToken, isAdmin, isMod } from "./utils/jwt-utils.js";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const authResult = await requireAuth(req, res);
	if (authResult.error) {
		return res.status(authResult.status).json({ error: authResult.error });
	}

	const { username, userId } = authResult;

	const rolesToken = createToken({
		username,
		userId,
		isAdmin: isAdmin(username),
		isMod: isMod(username),
	});

	return res.status(200).json({ rolesToken });
}

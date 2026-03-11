import { getUserLists, verifyToken } from "./utils/jwt-utils.js";

export async function requireAuth(req, res) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return { error: "Unauthorized", status: 401 };
	}

	let token = authHeader.replace("Bearer ", "").trim();

	if (
		(token.startsWith('"') && token.endsWith('"')) ||
		(token.startsWith("'") && token.endsWith("'"))
	) {
		token = token.slice(1, -1);
	}

	try {
		const validateResponse = await fetch(
			"https://id.twitch.tv/oauth2/validate",
			{
				headers: {
					Authorization: `OAuth ${token}`,
				},
			},
		);

		if (validateResponse.ok) {
			const data = await validateResponse.json();
			const username = data.login?.toLowerCase();
			const userId = data.user_id;
			return { username, userId, token };
		}
	} catch (error) {}

	try {
		const payload = verifyToken(token);
		if (payload && payload.username && payload.userId) {
			const username = String(payload.username).toLowerCase();
			const userId = payload.userId;
			return { username, userId, token };
		}
	} catch (err) {}

	return { error: "Invalid token", status: 401 };
}

export async function requireAdmin(req, res) {
	const authResult = await requireAuth(req, res);
	if (authResult.error) {
		return authResult;
	}

	const { username, token } = authResult;
	const { adminUsers } = getUserLists();

	if (!adminUsers.includes(username.toLowerCase())) {
		return { error: "Forbidden - Admin access required", status: 403 };
	}

	return { username, token };
}

export async function requireMod(req, res) {
	const authResult = await requireAuth(req, res);
	if (authResult.error) {
		return authResult;
	}

	const { username, token } = authResult;
	const { modUsers } = getUserLists();

	if (!modUsers.includes(username.toLowerCase())) {
		return { error: "Forbidden - Moderator access required", status: 403 };
	}

	return { username, token };
}

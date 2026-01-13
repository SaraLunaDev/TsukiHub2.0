import { getUserLists } from "./utils/jwt-utils.js";

export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const validateResponse = await fetch(
      "https://id.twitch.tv/oauth2/validate",
      {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      }
    );

    if (!validateResponse.ok) {
      return { error: "Invalid token", status: 401 };
    }

    const data = await validateResponse.json();
    const username = data.login?.toLowerCase();
    const userId = data.user_id;

    return { username, userId, token };
  } catch (error) {
    return { error: "Authentication failed", status: 500 };
  }
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

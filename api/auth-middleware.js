export function requireAuth(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");

  return { token };
}

export async function requireAdmin(req, res) {
  const { token, error, status } = requireAuth(req, res);

  if (error) {
    return { error, status };
  }

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

    const ADMIN_USERS = (
      process.env.ADMIN_USERS || "tsukisoft,tsukiwichan"
    ).split(",");

    if (!ADMIN_USERS.includes(username)) {
      return { error: "Forbidden - Admin access required", status: 403 };
    }

    return { username, token };
  } catch (error) {
    return { error: "Authentication failed", status: 500 };
  }
}

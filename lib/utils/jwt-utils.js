import jwt from "jsonwebtoken";

function getJWTSecret() {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET environment variable is required");
	}
	return secret;
}

export function createToken(payload) {
	return jwt.sign(payload, getJWTSecret());
}

export function verifyToken(token) {
	try {
		return jwt.verify(token, getJWTSecret());
	} catch (error) {
		return null;
	}
}

export function getUserLists() {
	const adminUsers = (process.env.ADMIN_USERS || "")
		.split(",")
		.map((u) => u.trim().toLowerCase())
		.filter(Boolean);

	const modUsers = (process.env.MOD_USERS || "")
		.split(",")
		.map((u) => u.trim().toLowerCase())
		.filter(Boolean);

	return { adminUsers, modUsers };
}

export function isAdmin(username) {
	const { adminUsers } = getUserLists();
	return adminUsers.includes(username.toLowerCase());
}

export function isMod(username) {
	const { modUsers } = getUserLists();
	return modUsers.includes(username.toLowerCase());
}

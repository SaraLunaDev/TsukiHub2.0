import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";


export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET);
}


export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
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

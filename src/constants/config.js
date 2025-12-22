// ============================================
// CONSTANTES DE CONFIGURACION
// ============================================

export const API_URLS = {
  TWITCH_AUTH: "https://id.twitch.tv/oauth2/authorize",
  TWITCH_TOKEN: "https://id.twitch.tv/oauth2/token",
  TWITCH_VALIDATE: "https://id.twitch.tv/oauth2/validate",
  TWITCH_USERS: "https://api.twitch.tv/helix/users",
};

const getRedirectUri = () => {
  if (process.env.REACT_APP_TWITCH_REDIRECT_URI) {
    return process.env.REACT_APP_TWITCH_REDIRECT_URI;
  }

  return window.location.origin;
};

export const TWITCH_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_TWITCH_CLIENT_ID || "",
  REDIRECT_URI: getRedirectUri(),
  SCOPES: ["user:read:email"],
};

export const STORAGE_KEYS = {
  TWITCH_USER: "twitchUser",
  TWITCH_TOKEN: "twitchToken",
  DEVELOPER_MODE: "developerMode",
  DARK_MODE: "darkMode",
};

export const ADMIN_USERS = ["tsukisoft", "tsukiwichan"];

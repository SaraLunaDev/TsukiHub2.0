// ============================================
// CONSTANTES DE CONFIGURACION
// ============================================

export const API_URLS = {
  TWITCH_AUTH: "https://id.twitch.tv/oauth2/authorize",
  TWITCH_TOKEN: "https://id.twitch.tv/oauth2/token",
  TWITCH_VALIDATE: "https://id.twitch.tv/oauth2/validate",
  TWITCH_USERS: "https://api.twitch.tv/helix/users",
  IGDB_SEARCH: "/api/igdb-search",
  TMDB_SEARCH: "/api/tmdb-search",
};

export const USER_SHEET_URL = process.env.REACT_APP_USER_SHEET_URL || "";

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

export const MOD_USERS = [
  "TsukiSoft",
  "vytoking",
  "Rabam",
  "dollanganger",
  "unai9x",
  "Vilexis98",
  "Samuel_Pincel",
  "el_capde",
  "pubgdemont",
  "AnaPandemonium",
  "Daruz",
  "alvaro_palmer",
  "Emilio2772",
  "enraid1",
  "ShadouShot",
  "oogiebuttie",
  "Lintes96",
  "Donramonrisas",
  "IreNuska__",
  "moon_defaultt",
  "BasedTrolso",
  "NucleoDeJuego",
  "eiosoydev",
  "maese_Javilon",
  "JOSEtomas99",
  "bigmacius",
  "KaranirNoFake",
  "Criis_joestar",
  "Achachancha",
  "TsukiwiChan",
  "JoranEssed",
];

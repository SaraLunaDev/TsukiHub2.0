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
  GET_SHEETS_CONFIG: "/api/get-sheets-config",
};

let cachedConfig = null;
let configPromise = null;

try {
  const stored = localStorage.getItem('sheets_config_cache');
  if (stored) {
    cachedConfig = JSON.parse(stored);
  }
} catch (e) {
  // Ignorar errores
}

export const getConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (configPromise) {
    return configPromise;
  }

  configPromise = fetch(API_URLS.GET_SHEETS_CONFIG)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to load config");
    })
    .then(config => {
      cachedConfig = config;
      try {
        localStorage.setItem('sheets_config_cache', JSON.stringify(config));
      } catch (e) {
        // Ignorar errores
      }
      return config;
    })
    .catch(error => {
      console.error("Error loading config:", error);
      return {
        juegosSheetUrl: "",
        pelisSheetUrl: "",
        userdataSheetUrl: "",
        userSheetUrl: "",
        twitchClientId: "",
        twitchRedirectUri: window.location.origin,
      };
    })
    .finally(() => {
      configPromise = null;
    });

  return configPromise;
};

getConfig();

export const TWITCH_CONFIG = {
  get CLIENT_ID() {
    return cachedConfig?.twitchClientId || "";
  },
  get REDIRECT_URI() {
    return cachedConfig?.twitchRedirectUri || window.location.origin;
  },
  SCOPES: ["user:read:email"],
};

export const STORAGE_KEYS = {
  TWITCH_USER: "twitchUser",
  TWITCH_TOKEN: "twitchToken",
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

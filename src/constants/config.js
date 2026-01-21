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
  VERIFY_USER: "/api/verify-user",
};

const CONFIG_VERSION = "4.0.0";

let cachedConfig = null;
let configPromise = null;

try {
  const stored = localStorage.getItem("sheets_config_cache");
  if (stored) {
    const parsed = JSON.parse(stored);

    if (
      !parsed.version ||
      parsed.version !== CONFIG_VERSION ||
      !parsed.gachaSheetUrl ||
      !parsed.gachaCharSheetUrl
    ) {
      localStorage.removeItem("sheets_config_cache");
    } else {
      cachedConfig = parsed;
    }
  }
} catch (e) {
  localStorage.removeItem("sheets_config_cache");
}

export const getConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (configPromise) {
    return configPromise;
  }

  configPromise = fetch(API_URLS.GET_SHEETS_CONFIG)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to load config");
    })
    .then((config) => {
      cachedConfig = config;
      try {
        localStorage.setItem("sheets_config_cache", JSON.stringify(config));
      } catch (e) {
        // Ignorar errores
      }
      return config;
    })
    .catch((error) => {
      return {
        juegosSheetUrl: "",
        pelisSheetUrl: "",
        userdataSheetUrl: "",
        pokedexSheetUrl: "",
        gachaSheetUrl: "",
        gachaCharSheetUrl: "",
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
  ROLES_TOKEN: "rolesToken",
  DARK_MODE: "darkMode",
};

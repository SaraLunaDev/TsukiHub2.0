// ============================================
// CONSTANTES DE CONFIGURACION
// ============================================
// Valores constantes usados en toda la aplicacion

// URLs de las APIs externas
export const API_URLS = {
  TWITCH_AUTH: 'https://id.twitch.tv/oauth2/authorize',
  TWITCH_TOKEN: 'https://id.twitch.tv/oauth2/token',
  TWITCH_VALIDATE: 'https://id.twitch.tv/oauth2/validate',
  TWITCH_USERS: 'https://api.twitch.tv/helix/users',
};

// Configuracion de Twitch OAuth
// La redirect URI se configura automaticamente:
// - En desarrollo: usa localhost:3000
// - En produccion: usa la URL actual (Vercel)
const getRedirectUri = () => {
  // Si hay una variable de entorno configurada, usarla
  if (process.env.REACT_APP_TWITCH_REDIRECT_URI) {
    return process.env.REACT_APP_TWITCH_REDIRECT_URI;
  }
  // Si no, usar la URL actual (funciona en desarrollo y produccion)
  return window.location.origin;
};

export const TWITCH_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_TWITCH_CLIENT_ID || '',
  REDIRECT_URI: getRedirectUri(),
  SCOPES: ['user:read:email'], // Permisos necesarios
};

// Claves de localStorage
export const STORAGE_KEYS = {
  TWITCH_USER: 'twitchUser',
  TWITCH_TOKEN: 'twitchToken',
  DEVELOPER_MODE: 'developerMode',
  DARK_MODE: 'darkMode',
};

// Lista de usuarios administradores (modo desarrollador)
export const ADMIN_USERS = [
  'tsukisoft',      // Tu usuario principal
  'tsukiwichan',    // Usuario alternativo
  // Agrega mas usuarios admin aqui
];

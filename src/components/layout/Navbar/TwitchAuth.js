// ============================================
// COMPONENTE: TwitchAuth
// ============================================
// Maneja la autenticacion con Twitch OAuth
// Muestra boton de login o info del usuario autenticado

import React, { useEffect, useState } from "react";
import useLocalStorage from "../../../hooks/useLocalStorage";
import {
  TWITCH_CONFIG,
  API_URLS,
  STORAGE_KEYS,
  ADMIN_USERS,
} from "../../../constants/config";
import "./TwitchAuth.css";

function TwitchAuth({ onLogin, onLogout }) {
  // Estado del usuario autenticado
  const [twitchUser, setTwitchUser] = useLocalStorage(
    STORAGE_KEYS.TWITCH_USER,
    null
  );
  const [, setTwitchToken] = useLocalStorage(STORAGE_KEYS.TWITCH_TOKEN, null);
  const [loading, setLoading] = useState(false);

  // Verificar si hay token en la URL (callback de Twitch)
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Buscar el token en el hash de la URL (#access_token=...)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        setLoading(true);

        // Extraer el token del hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");

        if (accessToken) {
          try {
            // Validar el token con Twitch
            const validateResponse = await fetch(API_URLS.TWITCH_VALIDATE, {
              headers: {
                Authorization: `OAuth ${accessToken}`,
              },
            });

            if (validateResponse.ok) {
              // Obtener informacion del usuario
              const userResponse = await fetch(API_URLS.TWITCH_USERS, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Client-Id": TWITCH_CONFIG.CLIENT_ID,
                },
              });

              if (userResponse.ok) {
                const userData = await userResponse.json();
                const user = userData.data[0];

                // Crear objeto de usuario simplificado
                const userInfo = {
                  id: user.id,
                  login: user.login,
                  displayName: user.display_name,
                  profileImage: user.profile_image_url,
                  email: user.email,
                };

                // Guardar usuario y token
                setTwitchUser(userInfo);
                setTwitchToken(accessToken);

                // Callback opcional
                if (onLogin) onLogin(userInfo);

                // Limpiar la URL del token
                window.history.replaceState(null, "", window.location.pathname);
              }
            }
          } catch (error) {
            alert("Error al autenticar con Twitch. Intenta de nuevo.");
          } finally {
            setLoading(false);
          }
        }
      }
    };

    handleAuthCallback();
  }, [setTwitchUser, setTwitchToken, onLogin]);

  // Funcion para iniciar login con Twitch
  const handleLogin = () => {
    // Construir URL de autorizacion de Twitch
    const authUrl =
      `${API_URLS.TWITCH_AUTH}?` +
      new URLSearchParams({
        client_id: TWITCH_CONFIG.CLIENT_ID,
        redirect_uri: TWITCH_CONFIG.REDIRECT_URI,
        response_type: "token",
        scope: TWITCH_CONFIG.SCOPES.join(" "),
      }).toString();

    // Redirigir a Twitch para autenticar
    window.location.href = authUrl;
  };

  // Funcion para hacer logout
  const handleLogout = () => {
    setTwitchUser(null);
    setTwitchToken(null);

    if (onLogout) onLogout();
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="twitch-auth">
        <span className="twitch-loading">Autenticando...</span>
      </div>
    );
  }

  // Si esta autenticado, mostrar info del usuario
  if (twitchUser) {
    return (
      <div className="twitch-auth">
        <div className="twitch-user">
          <img
            src={twitchUser.profileImage}
            alt={twitchUser.displayName}
            className="twitch-avatar"
          />
          <span className="twitch-username">{twitchUser.displayName}</span>
        </div>
        <button
          className="twitch-logout-button"
          onClick={handleLogout}
          title="Cerrar sesion"
        >
          ✕
        </button>
      </div>
    );
  }

  // Si no esta autenticado, mostrar boton de login
  return (
    <div className="twitch-auth">
      <button className="twitch-login-button" onClick={handleLogin}>
        <span className="twitch-icon">📺</span>
        Iniciar con Twitch
      </button>
    </div>
  );
}

export default TwitchAuth;

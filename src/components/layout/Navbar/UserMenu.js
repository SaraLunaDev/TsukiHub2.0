// ============================================
// COMPONENTE: UserMenu
// ============================================
// Menu de usuario que funciona en PC y movil
// - PC: Dropdown desde el navbar superior
// - Movil: Icono de perfil en el navbar inferior

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../../../hooks/useLocalStorage";
import {
  TWITCH_CONFIG,
  API_URLS,
  STORAGE_KEYS,
} from "../../../constants/config";
import { getRolesFromToken } from "../../../utils/jwt-client";
import "./UserMenu.css";

import { MaterialSymbolsAccountCircleFull } from "../../icons/MaterialSymbolsAccountCircleFull";
import { MaterialSymbolsAddCircleOutlineRounded } from "../../icons/MaterialSymbolsAddCircleOutlineRounded";
import { MaterialSymbolsWbSunnyOutlineRounded } from "../../icons/MaterialSymbolsWbSunnyOutlineRounded";
import { MaterialSymbolsDarkModeOutlineRounded } from "../../icons/MaterialSymbolsDarkModeOutlineRounded";
import { MdiTwitch } from "../../icons/MdiTwitch";
import { MingcuteExitLine } from "../../icons/MingcuteExitLine";
import { MaterialSymbolsListsRounded } from "../../icons/MaterialSymbolsListsRounded";

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Estados persistentes
  const [twitchUser, setTwitchUser] = useLocalStorage(
    STORAGE_KEYS.TWITCH_USER,
    null
  );
  const [twitchToken, setTwitchToken] = useLocalStorage(
    STORAGE_KEYS.TWITCH_TOKEN,
    null
  );
  const [rolesToken, setRolesToken] = useLocalStorage(
    STORAGE_KEYS.ROLES_TOKEN,
    null
  );
  const [darkMode, setDarkMode] = useLocalStorage(STORAGE_KEYS.DARK_MODE, true);

  // Obtener roles SOLO del JWT (ignorar cualquier valor en twitchUser)
  const getUserRoles = () => {
    if (!rolesToken) {
      return { isAdmin: false, isMod: false };
    }
    return getRolesFromToken(rolesToken);
  };

  const { isAdmin } = getUserRoles();

  // ACTUALIZAR JWT DE ROLES SI ES NECESARIO
  useEffect(() => {
    const verifyRoles = async () => {
      if (!twitchUser || !twitchToken) return;

      if (rolesToken) {
        return;
      }

      // Obtener nuevo token del servidor
      try {
        const response = await fetch(API_URLS.VERIFY_USER, {
          headers: { Authorization: `Bearer ${twitchToken}` },
        });

        if (response.ok) {
          const { rolesToken: newToken } = await response.json();
          setRolesToken(newToken);
        } else {
          setRolesToken(null);
        }
      } catch (error) {
        console.error("[UserMenu] Error obteniendo roles:", error);
        setRolesToken(null);
      }
    };

    verifyRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twitchUser?.login, twitchToken, rolesToken]);

  // Aplicar tema al body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Cerrar menu al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Verificar si hay token en la URL (callback de Twitch)
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;

      if (hash && hash.includes("access_token")) {
        setLoading(true);

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");

        if (accessToken) {
          try {
            // Validar el token

            const validateResponse = await fetch(API_URLS.TWITCH_VALIDATE, {
              headers: { Authorization: `OAuth ${accessToken}` },
            });

            if (validateResponse.ok) {
              // Obtener datos del usuario

              const userResponse = await fetch(API_URLS.TWITCH_USERS, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Client-Id": TWITCH_CONFIG.CLIENT_ID,
                },
              });

              if (userResponse.ok) {
                const userData = await userResponse.json();

                const user = userData.data[0];

                const userInfo = {
                  id: user.id,
                  login: user.login,
                  displayName: user.display_name,
                  profileImage: user.profile_image_url,
                  email: user.email,
                };

                // Obtener JWT con roles (NO guardar en userInfo)
                try {
                  const rolesResponse = await fetch(API_URLS.VERIFY_USER, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                  });

                  if (rolesResponse.ok) {
                    const { rolesToken: newToken } = await rolesResponse.json();
                    setRolesToken(newToken);
                  } else {
                    setRolesToken(null);
                  }
                } catch (roleError) {
                  console.error(
                    "[UserMenu] Error obteniendo roles:",
                    roleError
                  );
                  setRolesToken(null);
                }

                setTwitchUser(userInfo);
                setTwitchToken(accessToken);

                // Limpiar la URL del hash sin recargar la pagina
                window.history.replaceState(
                  null,
                  "",
                  window.location.pathname + window.location.search
                );
              }
            }
          } catch (error) {
          } finally {
            setLoading(false);
          }
        }
      }
    };

    handleAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTwitchUser, setTwitchToken]);

  // Funciones de control
  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogin = () => {
    const authUrl =
      `${API_URLS.TWITCH_AUTH}?` +
      new URLSearchParams({
        client_id: TWITCH_CONFIG.CLIENT_ID,
        redirect_uri: TWITCH_CONFIG.REDIRECT_URI,
        response_type: "token",
        scope: TWITCH_CONFIG.SCOPES.join(" "),
      }).toString();

    window.location.href = authUrl;
  };

  const handleLogout = () => {
    setTwitchUser(null);
    setTwitchToken(null);
    setRolesToken(null);
    setIsOpen(false);
    navigate("/");
  };

  const handleGoToProfile = () => {
    if (twitchUser) {
      navigate(`/user/${twitchUser.login}`);
      setIsOpen(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="user-menu-button">
        <span className="user-menu-loading">...</span>
      </div>
    );
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-button"
        onClick={toggleMenu}
        title={twitchUser ? twitchUser.displayName : "Menu de usuario"}
      >
        {twitchUser ? (
          <img
            src={twitchUser.profileImage}
            alt={twitchUser.displayName}
            className="user-menu-avatar"
          />
        ) : (
          <MaterialSymbolsAccountCircleFull className="user-menu-icon" />
        )}
      </button>

      {/* Dropdown del menu */}
      {isOpen && (
        <div className="user-menu-dropdown">
          {/* Opciones del menu */}
          <div className="user-menu-options">
            {/* Perfil de usuario */}
            {twitchUser && (
              <button
                className="user-menu-profile-button"
                onClick={handleGoToProfile}
              >
                <img
                  src={twitchUser.profileImage}
                  alt={twitchUser.displayName}
                  className="user-menu-profile-avatar"
                />
                <div className="user-menu-profile-info">
                  <span className="user-menu-profile-name">
                    {twitchUser.displayName}
                  </span>
                  <span className="user-menu-profile-link">Mostrar Perfil</span>
                </div>
              </button>
            )}

            {/* Botón Recomendar y Añadir para móvil y PC (solo desarrollador) */}
            {(window.location.pathname === "/juegos" ||
              window.location.pathname === "/pelis") && (
              <>
                {window.innerWidth < 769 && (
                  <button
                    className={`user-menu-option user-menu-option-primary${
                      twitchUser ? " user-menu-option-divider" : ""
                    }`}
                    onClick={() => {
                      if (window.location.pathname === "/juegos")
                        window.location.href = "/juegos/recomendar";
                      else if (window.location.pathname === "/pelis")
                        window.location.href = "/pelis/recomendar";
                      setIsOpen(false);
                    }}
                  >
                    <MaterialSymbolsListsRounded className="user-menu-option-icon" />
                    <span className="user-menu-option-text">
                      Recomendaciones
                    </span>
                  </button>
                )}
                {isAdmin && (
                  <>
                    {window.location.pathname === "/juegos" && (
                      <button
                        className="user-menu-option user-menu-option-primary user-menu-option-divider"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("openAddGamePopup")
                          );
                          setIsOpen(false);
                        }}
                      >
                        <MaterialSymbolsAddCircleOutlineRounded className="user-menu-option-icon" />
                        <span className="user-menu-option-text">
                          Añadir Juego
                        </span>
                      </button>
                    )}
                    {window.location.pathname === "/pelis" && (
                      <button
                        className="user-menu-option user-menu-option-primary user-menu-option-divider"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("openAddMoviePopup")
                          );
                          setIsOpen(false);
                        }}
                      >
                        <MaterialSymbolsAddCircleOutlineRounded className="user-menu-option-icon" />
                        <span className="user-menu-option-text">
                          Añadir Pelicula/Serie
                        </span>
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* Tema */}
            {/* Tema y Login/Logout con divisores condicionales en móvil */}
            {window.innerWidth < 769 && !twitchUser ? (
              <>
                <button
                  className={`user-menu-option user-menu-option-theme${
                    window.location.pathname === "/juegos" ||
                    window.location.pathname === "/pelis"
                      ? " user-menu-option-divider"
                      : ""
                  }`}
                  onClick={toggleTheme}
                >
                  {darkMode ? (
                    <MaterialSymbolsWbSunnyOutlineRounded className="user-menu-option-icon" />
                  ) : (
                    <MaterialSymbolsDarkModeOutlineRounded className="user-menu-option-icon" />
                  )}
                  <span className="user-menu-option-text">
                    {darkMode ? "Modo Claro" : "Modo Oscuro"}
                  </span>
                </button>
                <button
                  className="user-menu-option user-menu-option-primary user-menu-option-divider"
                  onClick={handleLogin}
                >
                  <MdiTwitch className="user-menu-option-icon user-menu-twitch-icon" />
                  <span className="user-menu-option-text">
                    Iniciar con Twitch
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="user-menu-option user-menu-option-theme user-menu-option-divider"
                  onClick={toggleTheme}
                >
                  {darkMode ? (
                    <MaterialSymbolsWbSunnyOutlineRounded className="user-menu-option-icon" />
                  ) : (
                    <MaterialSymbolsDarkModeOutlineRounded className="user-menu-option-icon" />
                  )}
                  <span className="user-menu-option-text">
                    {darkMode ? "Modo Claro" : "Modo Oscuro"}
                  </span>
                </button>
                {twitchUser ? (
                  <button
                    className="user-menu-option user-menu-option-danger user-menu-option-divider"
                    onClick={handleLogout}
                  >
                    <MingcuteExitLine className="user-menu-option-icon" />
                    <span className="user-menu-option-text">Cerrar Sesion</span>
                  </button>
                ) : (
                  <button
                    className="user-menu-option user-menu-option-primary"
                    onClick={handleLogin}
                  >
                    <MdiTwitch className="user-menu-option-icon user-menu-twitch-icon" />
                    <span className="user-menu-option-text">
                      Iniciar con Twitch
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;

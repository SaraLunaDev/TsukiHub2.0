// ============================================
// COMPONENTE: UserMenu
// ============================================
// Menu de usuario que funciona en PC y movil
// - PC: Dropdown desde el navbar superior
// - Movil: Icono de perfil en el navbar inferior

import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { TWITCH_CONFIG, API_URLS, STORAGE_KEYS, ADMIN_USERS } from '../../../constants/config';
import './UserMenu.css';

function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef(null);

    // Estados persistentes
    const [twitchUser, setTwitchUser] = useLocalStorage(STORAGE_KEYS.TWITCH_USER, null);
    const [, setTwitchToken] = useLocalStorage(STORAGE_KEYS.TWITCH_TOKEN, null);
    const [darkMode, setDarkMode] = useLocalStorage(STORAGE_KEYS.DARK_MODE, true);
    const [, setDeveloperMode] = useLocalStorage(STORAGE_KEYS.DEVELOPER_MODE, false);

    // Aplicar tema al body
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
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
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    // Verificar si hay token en la URL (callback de Twitch)
    useEffect(() => {
        const handleAuthCallback = async () => {
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                setLoading(true);

                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');

                if (accessToken) {
                    try {
                        const validateResponse = await fetch(API_URLS.TWITCH_VALIDATE, {
                            headers: { 'Authorization': `OAuth ${accessToken}` }
                        });

                        if (validateResponse.ok) {
                            const userResponse = await fetch(API_URLS.TWITCH_USERS, {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Client-Id': TWITCH_CONFIG.CLIENT_ID
                                }
                            });

                            if (userResponse.ok) {
                                const userData = await userResponse.json();
                                const user = userData.data[0];

                                const userInfo = {
                                    id: user.id,
                                    login: user.login,
                                    displayName: user.display_name,
                                    profileImage: user.profile_image_url,
                                    email: user.email
                                };

                                setTwitchUser(userInfo);
                                setTwitchToken(accessToken);

                                const isAdmin = ADMIN_USERS.includes(user.login.toLowerCase());
                                setDeveloperMode(isAdmin);

                                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                            }
                        }
                    } catch (error) {
                        console.error('Error en autenticacion Twitch:', error);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        };

        handleAuthCallback();
    }, [setTwitchUser, setTwitchToken, setDeveloperMode]);

    // Funciones de control
    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLogin = () => {
        const authUrl = `${API_URLS.TWITCH_AUTH}?` + new URLSearchParams({
            client_id: TWITCH_CONFIG.CLIENT_ID,
            redirect_uri: TWITCH_CONFIG.REDIRECT_URI,
            response_type: 'token',
            scope: TWITCH_CONFIG.SCOPES.join(' ')
        }).toString();
        window.location.href = authUrl;
    };

    const handleLogout = () => {
        setTwitchUser(null);
        setTwitchToken(null);
        setDeveloperMode(false);
        setIsOpen(false);
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
            {/* Boton del menu (avatar o icono) */}
            <button
                className="user-menu-button"
                onClick={toggleMenu}
                title={twitchUser ? twitchUser.displayName : 'Menu de usuario'}
            >
                {twitchUser ? (
                    <img
                        src={twitchUser.profileImage}
                        alt={twitchUser.displayName}
                        className="user-menu-avatar"
                    />
                ) : (
                    <span className="user-menu-icon">👤</span>
                )}
            </button>

            {/* Dropdown del menu */}
            {isOpen && (
                <div className="user-menu-dropdown">
                    {/* Usuario autenticado */}
                    {twitchUser && (
                        <div className="user-menu-header">
                            <img
                                src={twitchUser.profileImage}
                                alt={twitchUser.displayName}
                                className="user-menu-dropdown-avatar"
                            />
                            <span className="user-menu-username">{twitchUser.displayName}</span>
                        </div>
                    )}

                    {/* Opciones del menu */}
                    <div className="user-menu-options">
                        {/* Tema */}
                        <button className="user-menu-option user-menu-option-theme" onClick={toggleTheme}>
                            <span className="user-menu-option-icon">{darkMode ? '☀️' : '🌙'}</span>
                            <span className="user-menu-option-text">
                                {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                            </span>
                        </button>

                        {/* Login / Logout */}
                        {twitchUser ? (
                            <button className="user-menu-option user-menu-option-danger" onClick={handleLogout}>
                                <span className="user-menu-option-icon">🚪</span>
                                <span className="user-menu-option-text">Cerrar Sesion</span>
                            </button>
                        ) : (
                            <button className="user-menu-option user-menu-option-primary" onClick={handleLogin}>
                                <span className="user-menu-option-icon">📺</span>
                                <span className="user-menu-option-text">Iniciar con Twitch</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserMenu;

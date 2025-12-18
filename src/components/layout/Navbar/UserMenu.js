// ============================================
// COMPONENTE: UserMenu
// ============================================
// Menu de usuario que funciona en PC y movil
// - PC: Dropdown desde el navbar superior
// - Movil: Icono de perfil en el navbar inferior

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { TWITCH_CONFIG, API_URLS, STORAGE_KEYS, ADMIN_USERS } from '../../../constants/config';
import './UserMenu.css';

function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
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
            console.log('Hash detectado:', hash);
            
            if (hash && hash.includes('access_token')) {
                setLoading(true);

                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');

                console.log('Access token obtenido:', accessToken ? 'Si' : 'No');

                if (accessToken) {
                    try {
                        // Validar el token
                        console.log('Validando token...');
                        const validateResponse = await fetch(API_URLS.TWITCH_VALIDATE, {
                            headers: { 'Authorization': `OAuth ${accessToken}` }
                        });

                        console.log('Respuesta de validacion:', validateResponse.status);

                        if (validateResponse.ok) {
                            // Obtener datos del usuario
                            console.log('Obteniendo datos del usuario...');
                            console.log('Client ID:', TWITCH_CONFIG.CLIENT_ID);
                            
                            const userResponse = await fetch(API_URLS.TWITCH_USERS, {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Client-Id': TWITCH_CONFIG.CLIENT_ID
                                }
                            });

                            console.log('Respuesta de usuario:', userResponse.status);

                            if (userResponse.ok) {
                                const userData = await userResponse.json();
                                console.log('Datos de usuario:', userData);
                                
                                const user = userData.data[0];

                                const userInfo = {
                                    id: user.id,
                                    login: user.login,
                                    displayName: user.display_name,
                                    profileImage: user.profile_image_url,
                                    email: user.email
                                };

                                console.log('Guardando usuario:', userInfo);
                                setTwitchUser(userInfo);
                                setTwitchToken(accessToken);

                                const isAdmin = ADMIN_USERS.includes(user.login.toLowerCase());
                                console.log('Es admin?', isAdmin);
                                setDeveloperMode(isAdmin);

                                // Limpiar la URL del hash sin recargar la pagina
                                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                            } else {
                                const errorData = await userResponse.json();
                                console.error('Error al obtener usuario:', errorData);
                            }
                        } else {
                            const errorData = await validateResponse.json();
                            console.error('Error al validar token:', errorData);
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
        console.log('Iniciando login con Twitch...');
        console.log('Client ID:', TWITCH_CONFIG.CLIENT_ID);
        console.log('Redirect URI:', TWITCH_CONFIG.REDIRECT_URI);
        
        const authUrl = `${API_URLS.TWITCH_AUTH}?` + new URLSearchParams({
            client_id: TWITCH_CONFIG.CLIENT_ID,
            redirect_uri: TWITCH_CONFIG.REDIRECT_URI,
            response_type: 'token',
            scope: TWITCH_CONFIG.SCOPES.join(' ')
        }).toString();
        
        console.log('URL de autenticacion:', authUrl);
        window.location.href = authUrl;
    };

    const handleLogout = () => {
        setTwitchUser(null);
        setTwitchToken(null);
        setDeveloperMode(false);
        setIsOpen(false);
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
                    <Icon icon="material-symbols:account-circle-full" className="user-menu-icon" />
                )}
            </button>

            {/* Dropdown del menu */}
            {isOpen && (
                <div className="user-menu-dropdown">
                    {/* Opciones del menu */}
                    <div className="user-menu-options">
                        {/* Perfil de usuario */}
                        {twitchUser && (
                            <button className="user-menu-profile-button" onClick={handleGoToProfile}>
                                <img
                                    src={twitchUser.profileImage}
                                    alt={twitchUser.displayName}
                                    className="user-menu-profile-avatar"
                                />
                                <div className="user-menu-profile-info">
                                    <span className="user-menu-profile-name">{twitchUser.displayName}</span>
                                    <span className="user-menu-profile-link">Mostrar Perfil</span>
                                </div>
                            </button>
                        )}

                        {/* Tema */}
                        <button className="user-menu-option user-menu-option-theme" onClick={toggleTheme}>
                            <Icon 
                                icon={darkMode ? 'material-symbols:wb-sunny-outline-rounded' : 'material-symbols:dark-mode-outline-rounded'} 
                                className="user-menu-option-icon" 
                            />
                            <span className="user-menu-option-text">
                                {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                            </span>
                        </button>

                        {/* Login / Logout */}
                        {twitchUser ? (
                            <button className="user-menu-option user-menu-option-danger user-menu-option-divider" onClick={handleLogout}>
                                <Icon icon="mingcute:exit-line" className="user-menu-option-icon" />
                                <span className="user-menu-option-text">Cerrar Sesion</span>
                            </button>
                        ) : (
                            <button className="user-menu-option user-menu-option-primary" onClick={handleLogin}>
                                <Icon icon="mdi:twitch" className="user-menu-option-icon" />
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

// ============================================
// COMPONENTE: MobileUserMenu
// ============================================
// Menu flotante para movil que muestra:
// - Usuario de Twitch
// - Boton de tema
// - Botones de desarrollador (si aplica)
// Solo visible en dispositivos moviles

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import TwitchAuth from './TwitchAuth';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../../constants/config';
import './MobileUserMenu.css';

function MobileUserMenu() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [darkMode, setDarkMode] = useLocalStorage(STORAGE_KEYS.DARK_MODE, true);
    const [isDeveloperMode] = useLocalStorage(STORAGE_KEYS.DEVELOPER_MODE, false);

    // Alternar menu
    const toggleMenu = () => setIsOpen(!isOpen);

    // Alternar tema
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        setIsOpen(false);
    };

    // Disparar evento para abrir popup de añadir juego
    const handleAddGameClick = () => {
        window.dispatchEvent(new CustomEvent('openAddGamePopup'));
        setIsOpen(false);
    };

    // Disparar evento para abrir popup de añadir pelicula
    const handleAddMovieClick = () => {
        window.dispatchEvent(new CustomEvent('openAddMoviePopup'));
        setIsOpen(false);
    };

    return (
        <>
            {/* Boton flotante para abrir menu */}
            <button
                className="mobile-menu-button"
                onClick={toggleMenu}
                aria-label="Menu de usuario"
            >
                ⚙️
            </button>

            {/* Menu desplegable */}
            {isOpen && (
                <>
                    {/* Overlay para cerrar al hacer clic fuera */}
                    <div
                        className="mobile-menu-overlay"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Contenido del menu */}
                    <div className="mobile-menu-content">
                        {/* Autenticacion con Twitch */}
                        <div className="mobile-menu-section">
                            <TwitchAuth
                                onLogin={() => setIsOpen(false)}
                                onLogout={() => setIsOpen(false)}
                            />
                        </div>

                        {/* Boton de tema */}
                        <div className="mobile-menu-section">
                            <button
                                className="mobile-menu-item"
                                onClick={toggleDarkMode}
                            >
                                <span className="mobile-menu-icon">
                                    {darkMode ? '☀️' : '🌙'}
                                </span>
                                <span className="mobile-menu-text">
                                    {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                                </span>
                            </button>
                        </div>

                        {/* Botones de desarrollador */}
                        {isDeveloperMode && (
                            <div className="mobile-menu-section">
                                {location.pathname === '/juegos' && (
                                    <button
                                        className="mobile-menu-item mobile-menu-item-primary"
                                        onClick={handleAddGameClick}
                                    >
                                        <span className="mobile-menu-icon">➕</span>
                                        <span className="mobile-menu-text">Añadir Juego</span>
                                    </button>
                                )}

                                {location.pathname === '/pelis' && (
                                    <button
                                        className="mobile-menu-item mobile-menu-item-primary"
                                        onClick={handleAddMovieClick}
                                    >
                                        <span className="mobile-menu-icon">➕</span>
                                        <span className="mobile-menu-text">Añadir Pelicula/Serie</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}

export default MobileUserMenu;

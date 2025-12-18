// ============================================
// COMPONENTE NAVBAR COMPLETO - RESPONSIVE
// ============================================
// - PC: Navbar superior con logo y texto (6 links)
// - Movil: Navbar inferior con 5 botones que alternan

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import UserMenu from './UserMenu';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../../constants/config';
import './Navbar.css';

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isDeveloperMode] = useLocalStorage(STORAGE_KEYS.DEVELOPER_MODE, false);
    const [darkMode, setDarkMode] = useLocalStorage(STORAGE_KEYS.DARK_MODE, true);

    // Disparar evento para abrir popup de añadir juego
    const handleAddGameClick = () => {
        window.dispatchEvent(new CustomEvent('openAddGamePopup'));
    };

    // Disparar evento para abrir popup de añadir pelicula/serie
    const handleAddMovieClick = () => {
        window.dispatchEvent(new CustomEvent('openAddMoviePopup'));
    };

    // ============================================
    // LOGICA DE ALTERNANCIA PARA MOVIL
    // ============================================

    // Alternar entre Juegos y Pelis
    const handleToggleJuegosPelis = () => {
        if (location.pathname === '/juegos') {
            navigate('/pelis');
        } else {
            navigate('/juegos');
        }
    };

    // Alternar entre Pokedex y Gacha
    const handleTogglePokedexGacha = () => {
        if (location.pathname.includes('/pokedex')) {
            navigate('/gacha/Dragon-Ball');
        } else {
            navigate('/pokedex/kanto');
        }
    };

    // Alternar entre GameBoy y TTS
    const handleToggleGameBoyTTS = () => {
        if (location.pathname === '/gameboy') {
            navigate('/tts');
        } else {
            navigate('/gameboy');
        }
    };

    // Determinar estado activo y que icono mostrar
    const isJuegosOrPelisActive = location.pathname === '/juegos' || location.pathname === '/pelis';
    const isPokedexOrGachaActive = location.pathname.includes('/pokedex') || location.pathname.includes('/gacha');
    const isGameBoyOrTTSActive = location.pathname === '/gameboy' || location.pathname === '/tts';

    // Icono segun que pagina estas viendo
    const juegosOrPelisIcon = location.pathname === '/pelis' ? 'material-symbols:videocam-rounded' : 'material-symbols:joystick';
    const pokedexOrGachaIcon = location.pathname.includes('/gacha') ? 'streamline-flex:gambling-remix' : 'ic:baseline-catching-pokemon';
    const gameBoyOrTTSIcon = location.pathname === '/tts' ? 'solar:microphone-bold' : 'streamline-plump:gameboy-remix';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* ============================================
            LOGO (solo PC) - Lleva a inicio
            ============================================ */}
                <Link to="/" className="navbar-logo" title="Inicio">
                    <img
                        src={darkMode ? '/static/resources/logo.png' : '/static/resources/logo_black.png'}
                        alt="Logo"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.textContent = 'Logo';
                        }}
                    />
                </Link>

                {/* ============================================
            LINKS DE NAVEGACION - PC (5 opciones)
            ============================================ */}
                <ul className="navbar-links navbar-links-desktop">
                    <li>
                        <Link
                            to="/juegos"
                            className={location.pathname === '/juegos' ? 'active' : ''}
                            title="Juegos"
                        >
                            <span className="nav-text">Juegos</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/pelis"
                            className={location.pathname === '/pelis' ? 'active' : ''}
                            title="Peliculas y Series"
                        >
                            <span className="nav-text">Pelis</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/pokedex/kanto"
                            className={location.pathname.includes('/pokedex') ? 'active' : ''}
                            title="Pokedex"
                        >
                            <span className="nav-text">Pokedex</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/gacha/Dragon-Ball"
                            className={location.pathname.includes('/gacha') ? 'active' : ''}
                            title="Gacha"
                        >
                            <span className="nav-text">Gacha</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/gameboy"
                            className={location.pathname === '/gameboy' ? 'active' : ''}
                            title="GameBoy"
                        >
                            <span className="nav-text">GameBoy</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/tts"
                            className={location.pathname === '/tts' ? 'active' : ''}
                            title="Text-to-Speech"
                        >
                            <span className="nav-text">TTS</span>
                        </Link>
                    </li>
                </ul>

                {/* ============================================
            BOTONES DE NAVEGACION - MOVIL (4 opciones)
            ============================================ */}
                <div className="navbar-links navbar-links-mobile">
                    {/* Boton 0: Inicio */}
                    <Link
                        to="/"
                        className={`navbar-mobile-button ${location.pathname === '/' ? 'active' : ''}`}
                        title="Inicio"
                    >
                        <Icon icon="material-symbols:other-houses-outline" className="nav-icon" />
                    </Link>

                    {/* Boton 1: Alterna entre Juegos y Pelis */}
                    <button
                        className={`navbar-mobile-button ${isJuegosOrPelisActive ? 'active' : ''} ${location.pathname === '/juegos' ? 'active-left' : ''
                            } ${location.pathname === '/pelis' ? 'active-right' : ''
                            }`}
                        onClick={handleToggleJuegosPelis}
                        title={location.pathname === '/pelis' ? 'Ver Juegos' : 'Ver Peliculas'}
                    >
                        <Icon icon={juegosOrPelisIcon} className="nav-icon" />
                    </button>

                    {/* Boton 2: Alterna entre GameBoy y TTS */}
                    <button
                        className={`navbar-mobile-button ${isGameBoyOrTTSActive ? 'active' : ''} ${location.pathname === '/gameboy' ? 'active-left' : ''
                            } ${location.pathname === '/tts' ? 'active-right' : ''
                            }`}
                        onClick={handleToggleGameBoyTTS}
                        title={location.pathname === '/tts' ? 'Ver GameBoy' : 'Ver TTS'}
                    >
                        <Icon
                            icon={gameBoyOrTTSIcon}
                            className={`nav-icon ${gameBoyOrTTSIcon === 'streamline-plump:gameboy-remix' ? 'nav-icon-gameboy' : ''}`}
                        />
                    </button>

                    {/* Boton 3: Alterna entre Pokedex y Gacha */}
                    <button
                        className={`navbar-mobile-button ${isPokedexOrGachaActive ? 'active' : ''} ${location.pathname.includes('/pokedex') ? 'active-left' : ''
                            } ${location.pathname.includes('/gacha') ? 'active-right' : ''
                            }`}
                        onClick={handleTogglePokedexGacha}
                        title={location.pathname.includes('/gacha') ? 'Ver Pokedex' : 'Ver Gacha'}
                    >
                        <Icon icon={pokedexOrGachaIcon} className="nav-icon" />
                    </button>

                    {/* Boton 4: Perfil de usuario */}
                    <div className="navbar-mobile-button navbar-mobile-user">
                        <UserMenu />
                    </div>
                </div>

                {/* ============================================
            SECCION DERECHA (solo PC)
            ============================================ */}
                <div className="navbar-right">
                    {/* Boton añadir juego (solo en /juegos y modo desarrollador) */}
                    {isDeveloperMode && location.pathname === '/juegos' && (
                        <button
                            className="navbar-add-button"
                            onClick={handleAddGameClick}
                            title="Añadir juego"
                        >
                            + Añadir
                        </button>
                    )}

                    {/* Boton añadir pelicula (solo en /pelis y modo desarrollador) */}
                    {isDeveloperMode && location.pathname === '/pelis' && (
                        <button
                            className="navbar-add-button"
                            onClick={handleAddMovieClick}
                            title="Añadir pelicula o serie"
                        >
                            + Añadir
                        </button>
                    )}

                    {/* Boton cambiar tema (solo PC) */}
                    <button
                        className="navbar-theme-button"
                        onClick={() => setDarkMode(!darkMode)}
                        title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                    >
                        <Icon
                            icon={darkMode ? 'material-symbols:wb-sunny-outline-rounded' : 'material-symbols:dark-mode-outline-rounded'}
                            style={{ fontSize: '24px' }}
                        />
                    </button>

                    {/* Menu de usuario */}
                    <UserMenu />
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

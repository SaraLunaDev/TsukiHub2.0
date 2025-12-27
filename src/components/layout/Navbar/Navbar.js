import { Link, useLocation, useNavigate } from "react-router-dom";
import UserMenu from "./UserMenu";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../../constants/config";
import "./Navbar.css";

import { MaterialSymbolsWbSunnyOutlineRounded } from "../../icons/MaterialSymbolsWbSunnyOutlineRounded";
import { MaterialSymbolsDarkModeOutlineRounded } from "../../icons/MaterialSymbolsDarkModeOutlineRounded";
import { MaterialSymbolsOtherHousesOutlineRounded } from "../../icons/MaterialSymbolsOtherHousesOutlineRounded";
import { StreamlinePlumpGameboyRemix } from "../../icons/StreamlinePlumpGameboyRemix";
import { MaterialSymbolsVideocamRounded } from "../../icons/MaterialSymbolsVideocamRounded";
import { MaterialSymbolsJoystick } from "../../icons/MaterialSymbolsJoystick";
import { StreamlineFlexGamblingRemix } from "../../icons/StreamlineFlexGamblingRemix";
import { IcBaselineCatchingPokemon } from "../../icons/IcBaselineCatchingPokemon";
import { SolarMicrophoneBold } from "../../icons/SolarMicrophoneBold";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useLocalStorage(STORAGE_KEYS.DARK_MODE, true);

  const handleToggleJuegosPelis = () => {
    if (location.pathname === "/juegos") {
      navigate("/pelis");
    } else {
      navigate("/juegos");
    }
  };

  const handleTogglePokedexGacha = () => {
    if (location.pathname.includes("/pokedex")) {
      navigate("/gacha/Dragon-Ball");
    } else {
      navigate("/pokedex/kanto");
    }
  };

  const handleToggleGameBoyTTS = () => {
    if (location.pathname === "/gameboy") {
      navigate("/tts");
    } else {
      navigate("/gameboy");
    }
  };

  const isJuegosOrPelisActive =
    location.pathname === "/juegos" || location.pathname === "/pelis";
  const isPokedexOrGachaActive =
    location.pathname.includes("/pokedex") ||
    location.pathname.includes("/gacha");
  const isGameBoyOrTTSActive =
    location.pathname === "/gameboy" || location.pathname === "/tts";

  const juegosOrPelisIcon =
    location.pathname === "/pelis" ? (
      <MaterialSymbolsVideocamRounded className="nav-icon" />
    ) : (
      <MaterialSymbolsJoystick className="nav-icon" />
    );
  const pokedexOrGachaIcon = location.pathname.includes("/gacha") ? (
    <StreamlineFlexGamblingRemix className="nav-icon" />
  ) : (
    <IcBaselineCatchingPokemon className="nav-icon" />
  );
  const gameBoyOrTTSIcon =
    location.pathname === "/tts" ? (
      <SolarMicrophoneBold className="nav-icon" />
    ) : (
      <StreamlinePlumpGameboyRemix className="nav-icon nav-icon-gameboy" />
    );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" title="Inicio">
          <img
            src={
              darkMode
                ? "/static/resources/logo.png"
                : "/static/resources/logo_black.png"
            }
            alt="Logo"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.textContent = "Logo";
            }}
          />
        </Link>

        <ul className="navbar-links navbar-links-desktop">
          <li>
            <Link
              to="/juegos"
              className={location.pathname === "/juegos" ? "active" : ""}
              title="Juegos"
            >
              <span className="nav-text">Juegos</span>
            </Link>
          </li>
          <li>
            <Link
              to="/pelis"
              className={location.pathname === "/pelis" ? "active" : ""}
              title="Peliculas y Series"
            >
              <span className="nav-text">Pelis</span>
            </Link>
          </li>
          <li>
            <Link
              to="/pokedex/kanto"
              className={location.pathname.includes("/pokedex") ? "active" : ""}
              title="Pokedex"
            >
              <span className="nav-text">Pokedex</span>
            </Link>
          </li>
          <li>
            <Link
              to="/gacha/Dragon-Ball"
              className={location.pathname.includes("/gacha") ? "active" : ""}
              title="Gacha"
            >
              <span className="nav-text">Gacha</span>
            </Link>
          </li>
          <li>
            <Link
              to="/gameboy"
              className={location.pathname === "/gameboy" ? "active" : ""}
              title="GameBoy"
            >
              <span className="nav-text">GameBoy</span>
            </Link>
          </li>
          <li>
            <Link
              to="/tts"
              className={location.pathname === "/tts" ? "active" : ""}
              title="Text-to-Speech"
            >
              <span className="nav-text">TTS</span>
            </Link>
          </li>
        </ul>

        <div className="navbar-links navbar-links-mobile">
          <Link
            to="/"
            className={`navbar-mobile-button ${
              location.pathname === "/" ? "active" : ""
            }`}
            title="Inicio"
          >
            <MaterialSymbolsOtherHousesOutlineRounded className="nav-icon" />
          </Link>

          <button
            className={`navbar-mobile-button ${
              isJuegosOrPelisActive ? "active" : ""
            } ${location.pathname === "/juegos" ? "active-left" : ""} ${
              location.pathname === "/pelis" ? "active-right" : ""
            }`}
            onClick={handleToggleJuegosPelis}
            title={
              location.pathname === "/pelis" ? "Ver Juegos" : "Ver Peliculas"
            }
          >
            {juegosOrPelisIcon}
          </button>

          <button
            className={`navbar-mobile-button ${
              isGameBoyOrTTSActive ? "active" : ""
            } ${location.pathname === "/gameboy" ? "active-left" : ""} ${
              location.pathname === "/tts" ? "active-right" : ""
            }`}
            onClick={handleToggleGameBoyTTS}
            title={location.pathname === "/tts" ? "Ver GameBoy" : "Ver TTS"}
          >
            {gameBoyOrTTSIcon}
          </button>

          <button
            className={`navbar-mobile-button ${
              isPokedexOrGachaActive ? "active" : ""
            } ${location.pathname.includes("/pokedex") ? "active-left" : ""} ${
              location.pathname.includes("/gacha") ? "active-right" : ""
            }`}
            onClick={handleTogglePokedexGacha}
            title={
              location.pathname.includes("/gacha") ? "Ver Pokedex" : "Ver Gacha"
            }
          >
            {pokedexOrGachaIcon}
          </button>

          <div className="navbar-mobile-button navbar-mobile-user">
            <UserMenu />
          </div>
        </div>

        <div className="navbar-right">
          {(location.pathname === "/juegos" ||
            location.pathname === "/pelis" ||
            location.pathname === "/juegos/recomendar" ||
            location.pathname === "/pelis/recomendar") && (
            <Link
              to={
                location.pathname.startsWith("/juegos")
                  ? "/juegos/recomendar"
                  : "/pelis/recomendar"
              }
              className={`navbar-link navbar-link-recomendar${
                location.pathname === "/juegos/recomendar" ||
                location.pathname === "/pelis/recomendar"
                  ? " active"
                  : ""
              }`}
              title="Recomendar"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 6px",
                color: "var(--text)",
                fontSize: "15px",
                fontWeight: 700,
                textDecoration: "none",
                borderRadius: "6px",
                position: "relative",
                minWidth: "60px",
              }}
            >
              <span
                className="nav-text"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                Recomendaciones
              </span>
            </Link>
          )}

          <button
            className="navbar-theme-button"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Modo Claro" : "Modo Oscuro"}
          >
            {darkMode ? (
              <MaterialSymbolsWbSunnyOutlineRounded
                style={{ fontSize: "24px" }}
              />
            ) : (
              <MaterialSymbolsDarkModeOutlineRounded
                style={{ fontSize: "24px" }}
              />
            )}
          </button>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

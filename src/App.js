// ============================================
// COMPONENTE PRINCIPAL DE LA APLICACION
// ============================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Inicio from './components/pages/Inicio/Inicio';
import Juegos from './components/pages/Juegos/Juegos';
import Pelis from './components/pages/Pelis/Pelis';
import Pokedex from './components/pages/Pokedex/Pokedex';
import Gacha from './components/pages/Gacha/Gacha';
import GameBoy from './components/pages/GameBoy/GameBoy';
import TTS from './components/pages/TTS/TTS';
import UserProfile from './components/pages/UserProfile/UserProfile';
import './App.css';

function App() {
    return (
        // El Router habilita la navegacion entre paginas sin recargar
        <Router>
            {/* El Layout que incluye Navbar y estructura comun */}
            <Layout>
                {/* El Routes define las rutas disponibles */}
                <Routes>
                    {/* La ruta raiz: Pagina de inicio */}
                    <Route path="/" element={<Inicio />} />

                    {/* La ruta de juegos */}
                    <Route path="/juegos" element={<Juegos />} />

                    {/* La ruta de peliculas y series */}
                    <Route path="/pelis" element={<Pelis />} />

                    {/* La ruta de pokedex con region opcional */}
                    <Route path="/pokedex" element={<Pokedex />} />
                    <Route path="/pokedex/:region" element={<Pokedex />} />

                    {/* La ruta de gacha con banner opcional */}
                    <Route path="/gacha" element={<Gacha />} />
                    <Route path="/gacha/:banner" element={<Gacha />} />

                    {/* La ruta de GameBoy */}
                    <Route path="/gameboy" element={<GameBoy />} />

                    {/* La ruta de TTS */}
                    <Route path="/tts" element={<TTS />} />

                    {/* La ruta de perfil de usuario */}
                    <Route path="/user/:username" element={<UserProfile />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Inicio from "./components/pages/Inicio/Inicio";
import Juegos from "./components/pages/Juegos/Juegos";
import Pelis from "./components/pages/Pelis/Pelis";
import Recomendar from "./components/pages/Recomendar/Recomendar";
import Pokedex from "./components/pages/Pokedex/Pokedex";
import Gacha from "./components/pages/Gacha/Gacha";
import GameBoy from "./components/pages/GameBoy/GameBoy";
import TTS from "./components/pages/TTS/TTS";
import UserProfile from "./components/pages/UserProfile/UserProfile";
import "./App.css";

function App() {
	return (
		<Router>
			{}
			<Layout>
				{}
				<Routes>
					{}
					<Route path="/" element={<Inicio />} />

					{}
					<Route path="/juegos" element={<Juegos />} />
					<Route path="/juegos/recomendar" element={<Recomendar />} />

					{}
					<Route path="/pelis" element={<Pelis />} />
					<Route path="/pelis/recomendar" element={<Recomendar />} />

					{}
					<Route path="/pokedex" element={<Pokedex />} />
					<Route path="/pokedex/:region" element={<Pokedex />} />

					{}
					<Route path="/gacha" element={<Gacha />} />
					<Route path="/gacha/:banner" element={<Gacha />} />

					{}
					<Route path="/gameboy" element={<GameBoy />} />

					{}
					<Route path="/tts" element={<TTS />} />

					{}
					<Route path="/user/:username" element={<UserProfile />} />
				</Routes>
			</Layout>
		</Router>
	);
}

export default App;

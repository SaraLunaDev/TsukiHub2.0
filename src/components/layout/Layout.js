// ============================================
// COMPONENTE LAYOUT
// ============================================
// Wrapper que envuelve todas las paginas
// Incluye el Navbar y estructura comun

import React from 'react';
import Navbar from './Navbar/Navbar';
import './Layout.css';

function Layout({ children }) {
    return (
        <div className="layout">
            {/* Barra de navegacion (superior en PC, inferior en movil) */}
            <Navbar />

            {/* Contenido principal de cada pagina */}
            <main className="layout-content">
                {children}
            </main>
        </div>
    );
}

export default Layout;

// ============================================
// PUNTO DE ENTRADA DE LA APLICACION REACT
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Crear el root de React
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizar la aplicacion
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// ============================================
// SERVIDOR DE DESARROLLO LOCAL
// ============================================

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ENDPOINTS DE API
// ============================================
const apiDir = path.join(__dirname, 'api');

// Verificar si existe el directorio api
if (fs.existsSync(apiDir)) {
    fs.readdirSync(apiDir).forEach(file => {
        if (file.endsWith('.js')) {
            const route = '/api/' + file.replace('.js', '');
            const handler = require(path.join(apiDir, file));

            // Registrar endpoint para todos los metodos HTTP
            app.all(route, async (req, res) => {
                try {
                    // Las funciones serverless exportan una funcion default o directa
                    if (typeof handler === 'function') {
                        await handler(req, res);
                    } else if (typeof handler.default === 'function') {
                        await handler.default(req, res);
                    } else {
                        res.status(500).json({
                            error: 'Handler invalido en ' + file
                        });
                    }
                } catch (err) {
                    console.error(`Error en ${route}:`, err);
                    res.status(500).json({
                        error: err.message || 'Error interno del servidor'
                    });
                }
            });

            console.log(`✓ Endpoint registrado: ${route}`);
        }
    });
} else {
    console.warn('⚠ Directorio /api no encontrado. Crealo para usar las APIs.');
}

// ============================================
// ARCHIVOS ESTATICOS
// ============================================
const staticDir = fs.existsSync(path.join(__dirname, 'build'))
    ? 'build'
    : 'public';

app.use(express.static(path.join(__dirname, staticDir)));

console.log(`✓ Sirviendo archivos estaticos desde /${staticDir}`);

// ============================================
// FALLBACK PARA REACT ROUTER
// ============================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, staticDir, 'index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log('');
    console.log('===========================================');
    console.log('🚀 SERVIDOR DE DESARROLLO INICIADO');
    console.log('===========================================');
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📁 Directorio estatico: ${staticDir}/`);
    console.log(`🔌 APIs disponibles en: /api/*`);
    console.log('===========================================');
    console.log('');
});

// ============================================
// SERVIDOR DE DESARROLLO LOCAL
// ============================================

import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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
const apiDir = path.join(__dirname, "api");

if (fs.existsSync(apiDir)) {
  const files = fs.readdirSync(apiDir);
  
  for (const file of files) {
    if (file.endsWith(".js")) {
      const route = "/api/" + file.replace(".js", "");
      const modulePath = path.join(apiDir, file);

      app.all(route, async (req, res) => {
        try {
          const handler = await import("file://" + modulePath);
          
          if (typeof handler === "function") {
            await handler(req, res);
          } else if (typeof handler.default === "function") {
            await handler.default(req, res);
          } else {
            res.status(500).json({
              error: "Handler invalido en " + file,
            });
          }
        } catch (err) {
          res.status(500).json({
            error: err.message || "Error interno del servidor",
          });
        }
      });
    }
  }
} else {
}

// ============================================
// ARCHIVOS ESTATICOS
// ============================================
const staticDir = fs.existsSync(path.join(__dirname, "build"))
  ? "build"
  : "public";

app.use(express.static(path.join(__dirname, staticDir)));

// ============================================
// FALLBACK PARA REACT ROUTER
// ============================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, staticDir, "index.html"));
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log("");
  console.log("===========================================");
  console.log("🚀 SERVIDOR DE DESARROLLO INICIADO");
  console.log("===========================================");
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📁 Directorio estatico: ${staticDir}/`);
  console.log(`🔌 APIs disponibles en: /api/*`);
  console.log("===========================================");
  console.log("");
});

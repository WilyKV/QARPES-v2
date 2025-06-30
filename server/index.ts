import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let globalLog: (msg: string, source?: string) => void = () => {};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      globalLog(logLine);
    }
  });

  next();
});

(async () => {
  const { log } = await import("./" + "vite.js");
  globalLog = log;
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "development" || app.get("env") === "development") {
    // Import dynamique pour éviter d'inclure vite en production
    const { setupVite } = await import("./" + "viteDev.js");
    await setupVite(app, server);
    
    // Créer automatiquement les fixtures en mode développement si la base est vide ou si forcé
    try {
      const { prisma } = await import("./db");
      const userCount = await prisma.user.count();
      const forceReload = (globalThis as any).process?.env?.FORCE_FIXTURES === "true";
      
      if (userCount === 0 || forceReload) {
        if (userCount > 0) {
          log("� Rechargement forcé des fixtures (FORCE_FIXTURES=true)...");
        } else {
          log("�📦 Base de données vide, chargement des fixtures...");
        }
        const { createCompleteFixtures } = await import("./fixtures-complete");
        await createCompleteFixtures();
        log("✅ Fixtures complètes créées automatiquement en mode développement");
      } else {
        log(`📊 Base de données déjà initialisée (${userCount} utilisateurs trouvés)`);
        log("💡 Pour recharger les fixtures, utilisez FORCE_FIXTURES=true");
      }
    } catch (error) {
      log("❌ Erreur lors de la création des fixtures:", error);
    }
  } else {
    const { serveStatic } = await import("./" + "vite.js");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 8080
  const port = 8080;
  app.listen(port, () => {
    log(`Server listening on http://localhost:${port}`);
  });
})();

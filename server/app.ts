import express, { type Express, type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";

export interface CreateAppOptions {
  nodeEnv?: string;
}

export async function createApp(opts?: CreateAppOptions): Promise<Express> {
  if (opts?.nodeEnv) {
    process.env.NODE_ENV = opts.nodeEnv;
  }

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.trim() === "") {
    throw new Error(
      "SESSION_SECRET environment variable is required but not set. " +
      "Set a strong random secret (e.g. openssl rand -hex 32) before starting the app."
    );
  }

  const app = express();

  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === "production" ? undefined : false,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Register all routes (includes setupAuth + requireAuth middleware + protected routes)
  await registerRoutes(app);

  // Error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      (err as { status?: number; statusCode?: number })?.status ||
      (err as { statusCode?: number })?.statusCode ||
      500;
    const message =
      (err as { message?: string })?.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return app;
}

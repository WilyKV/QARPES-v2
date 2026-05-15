import "express";
import "express-session";

export interface SessionUser {
  id: string;
  email?: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  expires_at?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
    oauth_state?: string;
    oauth_state_expires_at?: number;
  }
}

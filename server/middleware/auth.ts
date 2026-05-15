import type { RequestHandler } from "express";

interface SessionUserLike {
  id?: string;
  expires_at?: number;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const sessionUser = (req.session as any)?.user as SessionUserLike | undefined;

  if (!sessionUser || !sessionUser.id) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (sessionUser.expires_at && Date.now() / 1000 > sessionUser.expires_at) {
    res.status(401).json({ message: "Session expired" });
    return;
  }

  (req as any).user = sessionUser;
  next();
};

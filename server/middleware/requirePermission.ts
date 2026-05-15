import type { RequestHandler } from "express";
import { hasPermission, type Permission } from "@shared/permissions";

export function requirePermission(perm: Permission): RequestHandler {
  return (req, res, next) => {
    const role = (req.session as any)?.user?.role as string | undefined;
    if (!hasPermission(role, perm)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}

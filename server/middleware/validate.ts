import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, source: Source = "body"): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ message: "Validation error", errors });
      return;
    }
    if (source === "body") {
      req.body = result.data;
    } else if (source === "query") {
      (req as any).query = result.data;
    } else if (source === "params") {
      (req as any).params = result.data;
    }
    next();
  };
}

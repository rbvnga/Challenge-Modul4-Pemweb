// src/middlewares/logger.ts
import type { NextFunction, Request, Response } from "express";

// Mencatat setiap request: METHOD /path -> status (durasi)
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on("finish", () => {
    console.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`,
    );
  });

  next(); // lanjut ke middleware / handler berikutnya
};
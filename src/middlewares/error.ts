// src/middlewares/error.ts
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";

const fail = (res: Response, status: number, message: string): void => {
  res.status(status).json({ status: false, message });
};

// Dipanggil kalau tidak ada route yang cocok
export const notFound = (req: Request, res: Response): void => {
  fail(res, 404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`);
};

// Semua error (throw / reject di handler async) akhirnya sampai di sini
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction, // wajib ada 4 parameter agar dikenali sebagai error handler
): void => {
  if (err instanceof HttpError) {
    fail(res, err.status, err.message);
    return;
  }

  if (typeof err === "object" && err !== null) {
    // Error dari Prisma membawa properti `code`
    if ("code" in err) {
      if (err.code === "P2002") return fail(res, 409, "Data sudah ada (nilai unik bentrok)");
      if (err.code === "P2025") return fail(res, 404, "Data tidak ditemukan");
      if (err.code === "P2003") return fail(res, 400, "Relasi data tidak valid");
    }
    // Error dari express.json() (mis. JSON rusak) membawa `status` 4xx
    if ("status" in err && typeof err.status === "number" && err.status < 500) {
      return fail(res, err.status, "Request tidak valid (cek format JSON kalian)");
    }
  }

  console.error(err);
  fail(res, 500, "Terjadi kesalahan pada server");
};
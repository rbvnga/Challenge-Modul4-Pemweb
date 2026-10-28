// src/controllers/userController.ts
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";

export const createUser = async (req: Request, res: Response) => {
  const { email, name, password } = req.body ?? {};

  // kalau email atau password kosong
  if (!email || !password) {
    throw new HttpError(400, "Email dan password wajib diisi");
  }

  // mencari apakah email sudah dipakai
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new HttpError(409, "Email sudah terdaftar");
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      // mengubah password menjadi hash satu arah
      password: await bcrypt.hash(password, 10),
    },
    // menentukan kolom yang dikembalikan. Kolom password sengaja tidak dipilih, jadi hash-nya tidak ikut ke response
    select: { id: true, email: true, name: true, createdAt: true },
  });

  sendSuccess(res, 201, "User berhasil dibuat", user);
};

// MENGAMBIL SEMUA USER
export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  sendSuccess(res, 200, "Berhasil mengambil data users", users);
};

// mencari satu user dengan findUnique
export const getUserById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      posts: {
        select: { id: true, title: true, published: true, createdAt: true },
      },
    },
  });

  if (!user) throw new HttpError(404, "User tidak ditemukan");

  sendSuccess(res, 200, "Berhasil mengambil data user", user);
};

export const updateUser = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { email, name } = req.body ?? {};

  const user = await prisma.user.update({
    where: { id },
    data: {
      //Kalau email ada isinya, ia menjadi ...{ email } dan field itu ikut diubah. Kalau tidak dikirim, hasilnya ...undefined, yang tidak menambah apa-apa.
      ...(email && { email }),
      ...(name && { name }),
    },
    select: { id: true, email: true, name: true, updatedAt: true },
  });

  sendSuccess(res, 200, "User berhasil diupdate", user);
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  await prisma.user.delete({ where: { id } });

  sendSuccess(res, 200, "User berhasil dihapus");
};

// GET /api/users/:id/posts?page=1&limit=5&published=true
export const getUserPosts = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  // Bedakan "user tidak ada" (404) dari "user ada tapi belum punya post" (200, array kosong)
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!user) throw new HttpError(404, "User tidak ditemukan");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const published =
    req.query.published === undefined
      ? undefined
      : req.query.published === "true";

  const where = {
    authorId: id,
    ...(published !== undefined && { published }),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data posts milik user", posts, {
    currentPage: page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
  });
};
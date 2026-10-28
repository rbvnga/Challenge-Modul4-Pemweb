// src/controllers/commentController.ts
import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";

const authorSelect = { select: { id: true, name: true, email: true } };

export const createComment = async (req: Request, res: Response) => {
  const { content, postId, authorId } = req.body ?? {};

  // mengecek post dan user benar-benar ada sebelum membuat komentar
  if (!content || !postId || !authorId) {
    throw new HttpError(400, "Content, postId, dan authorId wajib diisi");
  }

  const post = await prisma.post.findUnique({ where: { id: parseId(postId) } });
  if (!post) throw new HttpError(404, "Post tidak ditemukan");

  const author = await prisma.user.findUnique({ where: { id: parseId(authorId) } });
  if (!author) throw new HttpError(404, "User tidak ditemukan");

  const comment = await prisma.comment.create({
    data: { content, postId: post.id, authorId: author.id },
    include: { author: authorSelect },
  });

  sendSuccess(res, 201, "Komentar berhasil dibuat", comment);
};

// GET /api/comments            -> semua komentar
// GET /api/comments?postId=1   -> komentar milik satu post
export const getAllComments = async (req: Request, res: Response) => {
  const where =
    req.query.postId === undefined
      ? {}
      : { postId: parseId(req.query.postId) };

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { author: authorSelect },
  });

  sendSuccess(res, 200, "Berhasil mengambil data komentar", comments);
};

export const getCommentById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { author: authorSelect },
  });
  if (!comment) throw new HttpError(404, "Komentar tidak ditemukan");

  sendSuccess(res, 200, "Berhasil mengambil data komentar", comment);
};

export const updateComment = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { content } = req.body ?? {};

  if (!content) throw new HttpError(400, "Content wajib diisi");

  // Jika id tidak ada, Prisma melempar P2025 -> errorHandler menjadikannya 404
  // hanya content yang boleh diubah dan wajib diisi.
  const comment = await prisma.comment.update({
    where: { id },
    data: { content },
    include: { author: authorSelect },
  });

  sendSuccess(res, 200, "Komentar berhasil diupdate", comment);
};

export const deleteComment = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  await prisma.comment.delete({ where: { id } });

  sendSuccess(res, 200, "Komentar berhasil dihapus");
};
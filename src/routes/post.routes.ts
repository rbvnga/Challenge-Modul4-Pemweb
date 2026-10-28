// src/routes/post.routes.ts
import { Router } from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  getPostStats,
  updatePost,
} from "../controllers/postController";

const router = Router();

router.post("/", createPost);
router.get("/", getAllPosts);
router.get("/stats", getPostStats); // HARUS di atas "/:id", kalau tidak "stats" dianggap sebagai id
router.get("/:id", getPostById);
router.patch("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;
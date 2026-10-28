// src/routes/index.ts
import { Router } from "express";
import foodRouter from "./food.routes";
import postRouter from "./post.routes";
import userRouter from "./user.routes";
import commentRouter from "./comment.routes";

const router = Router();

router.use("/food", foodRouter);
router.use("/users", userRouter);
router.use("/posts", postRouter);
router.use("/comments", commentRouter);

export default router;
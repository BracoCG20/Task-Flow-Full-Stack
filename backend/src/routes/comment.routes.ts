import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import * as commentController from "../controllers/comment.controller";

const router = Router({ mergeParams: true }); // Important: allow access to :taskId from parent router

router.get("/", authenticateToken, commentController.getComments);
router.post("/", authenticateToken, commentController.createComment);

export default router;

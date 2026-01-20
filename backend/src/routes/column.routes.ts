import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import * as boardController from "../controllers/board.controller";

const router = Router();

// Todas estas rutas requieren estar logueado (authenticateToken)
router.delete("/:id", authenticateToken, boardController.deleteColumn);
router.patch("/:id", authenticateToken, boardController.updateColumn);
router.put("/reorder", authenticateToken, boardController.reorderColumns);

export default router;

import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import * as boardController from "../controllers/board.controller";

const router = Router();

// Rutas de Tableros (/boards)
router.get("/", authenticateToken, boardController.getBoards);
router.post("/", authenticateToken, boardController.createBoard);

// Rutas de Columnas anidadas o directas.
// Tu frontend llama a: POST /boards/:id/columns
router.post(
	"/:boardId/columns",
	authenticateToken,
	boardController.createColumn,
);

export default router;

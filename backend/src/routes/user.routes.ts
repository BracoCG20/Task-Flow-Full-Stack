import { Router } from "express";
import {
	authenticateToken,
	requireAdmin,
} from "../middlewares/auth.middleware";
import * as userController from "../controllers/user.controller";

const router = Router();

// Rutas base: /users
router.get("/", authenticateToken, requireAdmin, userController.getUsers);
router.post("/", authenticateToken, requireAdmin, userController.createUser);
router.delete(
	"/:id",
	authenticateToken,
	requireAdmin,
	userController.deleteUser,
);
router.put(
	"/:id/password",
	authenticateToken,
	requireAdmin,
	userController.resetPassword,
);

// Rutas extra (Perfil y Stats)
// Nota: Estas las montaremos en el index.ts por separado o aquí mismo.
// Para mantener compatibilidad con tu frontend actual, sugiero montarlas en rutas especificas en index.ts
// OJO: Stats es /admin/stats y Perfil es /profile. Las manejaremos en index.ts para no romper rutas.

export default router;

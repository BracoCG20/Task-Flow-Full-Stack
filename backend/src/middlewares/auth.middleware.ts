import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
const JWT_SECRET = process.env.JWT_SECRET || "mi_secreto_super_seguro";

export interface AuthRequest extends Request {
	userId?: number;
	userRole?: string;
}

export const authenticateToken = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
): void => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		res.status(401).json({ error: "Acceso denegado" });
		return;
	}

	jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
		if (err) {
			res.status(403).json({ error: "Token inválido" });
			return;
		}
		const user = await prisma.user.findUnique({ where: { id: decoded.id } });
		if (!user) {
			res.status(404).json({ error: "Usuario no existe" });
			return;
		}
		req.userId = user.id;
		req.userRole = user.role;
		next();
	});
};

export const requireAdmin = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
): void => {
	if (req.userRole !== "ADMIN") {
		res.status(403).json({ error: "Requiere privilegios de Administrador" });
		return;
	}
	next();
};

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
const JWT_SECRET = process.env.JWT_SECRET || "mi_secreto_super_seguro";

export const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		const user = await prisma.user.findUnique({ where: { email } });

		if (!user || !(await bcrypt.compare(password, user.password))) {
			res.status(400).json({ error: "Credenciales incorrectas" });
			return;
		}

		const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "8h" });
		res.json({ token, name: user.name, role: user.role, userId: user.id });
	} catch (error) {
		res.status(500).json({ error: "Error en login" });
	}
};

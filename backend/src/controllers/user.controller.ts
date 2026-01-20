import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma"; // Asegúrate de tener este archivo o usa new PrismaClient()
import { AuthRequest } from "../middlewares/auth.middleware";

export const getUsers = async (req: Request, res: Response) => {
	const users = await prisma.user.findMany({
		select: { id: true, name: true, email: true, role: true },
	});
	res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
	try {
		const { email, password, name, role } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await prisma.user.create({
			data: { email, name, password: hashedPassword, role: role || "USER" },
		});
		// Crear tablero por defecto
		await prisma.board.create({
			data: {
				title: `Tablero de ${name}`,
				ownerId: newUser.id,
				columns: {
					create: [
						{ title: "Pendiente", order: 0 },
						{ title: "En Proceso", order: 1 },
						{ title: "Terminado", order: 2 },
					],
				},
			},
		});
		res.json(newUser);
	} catch (error) {
		res.status(500).json({ error: "Error al crear usuario" });
	}
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
	const targetUserId = Number(req.params.id);
	if (targetUserId === req.userId) {
		res.status(400).json({ error: "No puedes borrar tu propia cuenta" });
		return;
	}
	try {
		// Borrado en cascada manual (si no está en schema) o simple delete si usaste onDelete: Cascade
		await prisma.user.delete({ where: { id: targetUserId } });
		res.json({ success: true });
	} catch (error) {
		res.status(500).json({ error: "Error al eliminar" });
	}
};

export const resetPassword = async (req: Request, res: Response) => {
	const { newPassword } = req.body;
	const hashedPassword = await bcrypt.hash(newPassword, 10);
	await prisma.user.update({
		where: { id: Number(req.params.id) },
		data: { password: hashedPassword },
	});
	res.json({ success: true });
};

export const getStats = async (req: Request, res: Response) => {
	// ... Tu lógica de estadísticas del index.ts antiguo ...
	const totalUsers = await prisma.user.count();
	const tasksByPriority = await prisma.task.groupBy({
		by: ["priority"],
		_count: { priority: true },
	});
	// (Simplificado para brevedad, copia tu lógica completa aquí si la necesitas)
	res.json({ totalUsers, tasksByPriority, tasksByUser: [] });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
	const { name, password } = req.body;
	const updateData: any = { name };
	if (password) updateData.password = await bcrypt.hash(password, 10);
	const user = await prisma.user.update({
		where: { id: req.userId },
		data: updateData,
	});
	res.json(user);
};

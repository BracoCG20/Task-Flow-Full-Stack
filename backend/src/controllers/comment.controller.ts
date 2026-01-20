import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getComments = async (req: Request, res: Response) => {
	try {
		const { taskId } = req.params;
		const comments = await prisma.comment.findMany({
			where: { taskId: Number(taskId) },
			include: {
				user: { select: { id: true, name: true, role: true } },
			},
			orderBy: { createdAt: "asc" },
		});
		res.json(comments);
	} catch (error) {
		res.status(500).json({ error: "Error al cargar comentarios" });
	}
};

export const createComment = async (req: AuthRequest, res: Response) => {
	try {
		const { taskId } = req.params;
		const { content } = req.body;

		const comment = await prisma.comment.create({
			data: {
				content,
				taskId: Number(taskId),
				userId: req.userId!,
			},
			include: {
				user: { select: { name: true, role: true } },
			},
		});
		res.json(comment);
	} catch (error) {
		res.status(500).json({ error: "No se pudo enviar el comentario" });
	}
};

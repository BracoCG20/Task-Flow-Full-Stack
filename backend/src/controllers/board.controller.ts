import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getBoards = async (req: AuthRequest, res: Response) => {
	let targetUserId = req.userId;
	if (req.query.userId && req.userRole === "ADMIN") {
		targetUserId = Number(req.query.userId);
	}

	const boards = await prisma.board.findMany({
		where: { ownerId: targetUserId },
		include: {
			columns: {
				include: {
					tasks: {
						include: {
							tags: true,
							subtasks: { orderBy: { id: "asc" } },
							attachments: true,
							activities: false,
						},
						orderBy: { order: "asc" },
					},
				},
				orderBy: { order: "asc" },
			},
		},
	});
	res.json(boards);
};

export const createBoard = async (req: AuthRequest, res: Response) => {
	// Lógica simple de crear tablero
	const board = await prisma.board.create({
		data: { title: req.body.title, ownerId: req.userId! },
	});
	res.json(board);
};

// --- COLUMNAS ---
export const createColumn = async (req: Request, res: Response) => {
	const { boardId } = req.params;
	const count = await prisma.column.count({
		where: { boardId: Number(boardId) },
	});
	const col = await prisma.column.create({
		data: { title: req.body.title, boardId: Number(boardId), order: count },
		include: { tasks: true },
	});
	res.json(col);
};

export const deleteColumn = async (req: Request, res: Response) => {
	await prisma.column.delete({ where: { id: Number(req.params.id) } });
	res.json({ success: true });
};

export const updateColumn = async (req: Request, res: Response) => {
	const updated = await prisma.column.update({
		where: { id: Number(req.params.id) },
		data: { title: req.body.title },
	});
	res.json(updated);
};

export const reorderColumns = async (req: Request, res: Response) => {
	const { columnIds } = req.body;
	const updates = columnIds.map((id: number, index: number) =>
		prisma.column.update({ where: { id }, data: { order: index } }),
	);
	await prisma.$transaction(updates);
	res.json({ success: true });
};

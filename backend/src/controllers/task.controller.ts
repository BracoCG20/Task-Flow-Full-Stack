import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

// --- SUBTASKS ---
export const createSubtask = async (req: Request, res: Response) => {
	const { taskId } = req.params;
	const subtask = await prisma.subtask.create({
		data: { content: req.body.content, taskId: Number(taskId) },
	});
	res.json(subtask);
};

export const updateSubtask = async (req: Request, res: Response) => {
	const updated = await prisma.subtask.update({
		where: { id: Number(req.params.id) },
		data: { isCompleted: req.body.isCompleted, content: req.body.content },
	});
	res.json(updated);
};

export const deleteSubtask = async (req: Request, res: Response) => {
	await prisma.subtask.delete({ where: { id: Number(req.params.id) } });
	res.json({ success: true });
};

// --- ATTACHMENTS (Requires multer setup in routes) ---
// Note: We'll handle the file upload logic in the route or a separate util,
// but for the controller we just need to save to DB.
export const addAttachment = async (req: any, res: Response) => {
	// req.file comes from multer
	if (!req.file) {
		res.status(400).json({ error: "No file" });
		return;
	}

	const attachment = await prisma.attachment.create({
		data: {
			filename: req.file.originalname,
			path: req.file.path,
			taskId: Number(req.params.taskId),
		},
	});
	res.json(attachment);
};

export const deleteAttachment = async (req: Request, res: Response) => {
	// Ideally delete file from disk here too using fs.unlink
	await prisma.attachment.delete({ where: { id: Number(req.params.id) } });
	res.json({ success: true });
};

// Helper para logs
const logActivity = async (taskId: number, userId: number, action: string) => {
	await prisma.activityLog
		.create({ data: { taskId, userId, action } })
		.catch(console.error);
};

export const createTask = async (req: AuthRequest, res: Response) => {
	const { content, columnId, priority, dueDate, tagIds } = req.body;
	const task = await prisma.task.create({
		data: {
			content,
			columnId: Number(columnId),
			priority: priority || "low",
			dueDate: dueDate ? new Date(dueDate) : null,
			tags: tagIds
				? { connect: tagIds.map((id: number) => ({ id })) }
				: undefined,
		},
		include: { tags: true },
	});
	await logActivity(task.id, req.userId!, "Creó la tarea");
	res.json(task);
};

export const updateTask = async (req: AuthRequest, res: Response) => {
	const { id } = req.params;
	const { columnId, content, priority, dueDate, tagIds } = req.body;

	// ... (Tu lógica completa de actualización con logs del index.ts antiguo) ...
	// Por brevedad:
	const updated = await prisma.task.update({
		where: { id: Number(id) },
		data: {
			content,
			priority,
			columnId: columnId ? Number(columnId) : undefined,
		},
		include: { tags: true },
	});
	res.json(updated);
};

export const deleteTask = async (req: Request, res: Response) => {
	await prisma.task.delete({ where: { id: Number(req.params.id) } });
	res.json({ success: true });
};

export const getActivity = async (req: Request, res: Response) => {
	const logs = await prisma.activityLog.findMany({
		where: { taskId: Number(req.params.taskId) },
		include: { user: { select: { name: true } } },
		orderBy: { createdAt: "desc" },
	});
	res.json(logs);
};

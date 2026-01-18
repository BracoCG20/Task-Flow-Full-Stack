import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

// Helper para registrar actividad
async function logActivity(taskId: number, userId: number, action: string) {
	try {
		await prisma.activityLog.create({
			data: { taskId, userId, action },
		});
	} catch (e) {
		console.error("Error creando log:", e);
	}
}

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
const JWT_SECRET = "mi_secreto_super_seguro";

app.use(express.json());
app.use(cors());

// --- TIPOS ---
interface AuthRequest extends Request {
	userId?: number;
	userRole?: string;
}

// 1. Configurar almacenamiento de Multer
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadPath = "uploads/";
		if (!fs.existsSync(uploadPath)) {
			fs.mkdirSync(uploadPath);
		}
		cb(null, uploadPath);
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});
const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --- MIDDLEWARES ---

// 1. Verificar Token
const authenticateToken = (
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

// 2. Verificar Admin
const requireAdmin = (
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

// --- RUTAS DE AUTH ---

app.post("/login", async (req, res) => {
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
});

// --- RUTAS DE ADMINISTRADOR ---

// Crear Usuario
app.post("/users", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { email, password, name, role } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: {
				email,
				name,
				password: hashedPassword,
				role: role || "USER",
			},
		});

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
});

// Listar Usuarios
app.get("/users", authenticateToken, requireAdmin, async (req, res) => {
	const users = await prisma.user.findMany({
		select: { id: true, name: true, email: true, role: true },
	});
	res.json(users);
});

// Eliminar Usuario
app.delete(
	"/users/:id",
	authenticateToken,
	requireAdmin,
	async (req: AuthRequest, res: Response) => {
		const { id } = req.params;
		const targetUserId = Number(id);

		if (targetUserId === req.userId) {
			res.status(400).json({ error: "No puedes borrar tu propia cuenta" });
			return;
		}

		try {
			const userBoards = await prisma.board.findMany({
				where: { ownerId: targetUserId },
				select: { id: true },
			});

			const boardIds = userBoards.map((b) => b.id);

			if (boardIds.length > 0) {
				await prisma.task.deleteMany({
					where: { column: { boardId: { in: boardIds } } },
				});
				await prisma.column.deleteMany({
					where: { boardId: { in: boardIds } },
				});
				await prisma.board.deleteMany({
					where: { ownerId: targetUserId },
				});
			}

			await prisma.user.delete({ where: { id: targetUserId } });

			res.json({ success: true });
		} catch (error) {
			console.error("Error al borrar usuario:", error);
			res.status(500).json({ error: "Error interno al eliminar usuario" });
		}
	},
);

// Cambiar Password (Admin)
app.put(
	"/users/:id/password",
	authenticateToken,
	requireAdmin,
	async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			const { newPassword } = req.body;

			if (!newPassword || newPassword.length < 6) {
				res
					.status(400)
					.json({ error: "La contraseña debe tener al menos 6 caracteres" });
				return;
			}

			const hashedPassword = await bcrypt.hash(newPassword, 10);

			await prisma.user.update({
				where: { id: Number(id) },
				data: { password: hashedPassword },
			});

			res.json({ success: true, message: "Contraseña actualizada" });
		} catch (error) {
			res.status(500).json({ error: "No se pudo cambiar la contraseña" });
		}
	},
);

// --- RUTAS DEL TABLERO ---

// Obtener Tableros
app.get("/boards", authenticateToken, async (req: AuthRequest, res) => {
	try {
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
	} catch (error) {
		res.status(500).json({ error: "Error al obtener tableros" });
	}
});

// Crear Tarea
app.post(
	"/tasks",
	authenticateToken,
	async (req: AuthRequest, res: Response) => {
		const { content, columnId, priority, dueDate, tagIds } = req.body;

		const newTask = await prisma.task.create({
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

		if (req.userId) {
			await logActivity(newTask.id, req.userId, "Creó la tarea");
		}
		res.json(newTask);
	},
);

// Editar / Mover Tarea (Versión Completa con Logs)
app.patch("/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
	const { id } = req.params;
	const { columnId, content, priority, dueDate, tagIds } = req.body;
	const userId = req.userId!;

	// 1. Obtener tarea anterior para comparar
	const oldTask = await prisma.task.findUnique({
		where: { id: Number(id) },
		include: { column: true },
	});

	if (!oldTask) {
		res.status(404).send();
		return;
	}

	// 2. Preparar update
	const data: any = {};
	if (columnId !== undefined) data.columnId = Number(columnId);
	if (content !== undefined) data.content = content;
	if (priority !== undefined) data.priority = priority;
	if (dueDate !== undefined) data.dueDate = new Date(dueDate);
	if (tagIds !== undefined) {
		data.tags = { set: tagIds.map((tid: number) => ({ id: tid })) };
	}

	// 3. Ejecutar update
	const updated = await prisma.task.update({
		where: { id: Number(id) },
		data,
		include: { tags: true },
	});

	// 4. DETECTAR CAMBIOS Y LOGUEAR
	if (columnId !== undefined && columnId !== oldTask.columnId) {
		const newCol = await prisma.column.findUnique({
			where: { id: Number(columnId) },
		});
		await logActivity(
			Number(id),
			userId,
			`Movió la tarea a lista: ${newCol?.title}`,
		);
	}

	if (priority !== undefined && priority !== oldTask.priority) {
		await logActivity(Number(id), userId, `Cambió prioridad a: ${priority}`);
	}

	if (tagIds !== undefined) {
		await logActivity(Number(id), userId, "Actualizó las etiquetas");
	}

	res.json(updated);
});

// Borrar Tarea
app.delete("/tasks/:id", authenticateToken, async (req, res) => {
	await prisma.task.delete({ where: { id: Number(req.params.id) } });
	res.json({ success: true });
});

// Reordenar Columnas
app.put("/columns/reorder", authenticateToken, async (req, res) => {
	const { columnIds } = req.body;
	const updates = columnIds.map((id: number, index: number) =>
		prisma.column.update({ where: { id: Number(id) }, data: { order: index } }),
	);
	await prisma.$transaction(updates);
	res.json({ success: true });
});

// --- COMENTARIOS ---

app.get("/tasks/:taskId/comments", authenticateToken, async (req, res) => {
	try {
		const comments = await prisma.comment.findMany({
			where: { taskId: Number(req.params.taskId) },
			include: { user: { select: { id: true, name: true, role: true } } },
			orderBy: { createdAt: "asc" },
		});
		res.json(comments);
	} catch (error) {
		res.status(500).json({ error: "Error al cargar comentarios" });
	}
});

app.post(
	"/tasks/:taskId/comments",
	authenticateToken,
	async (req: AuthRequest, res) => {
		try {
			const comment = await prisma.comment.create({
				data: {
					content: req.body.content,
					taskId: Number(req.params.taskId),
					userId: req.userId!,
				},
				include: { user: { select: { name: true, role: true } } },
			});
			res.json(comment);
		} catch (error) {
			res.status(500).json({ error: "Error al enviar comentario" });
		}
	},
);

// --- ESTADÍSTICAS ---

app.get("/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const totalUsers = await prisma.user.count();
		const tasksByPriority = await prisma.task.groupBy({
			by: ["priority"],
			_count: { priority: true },
		});

		const usersData = await prisma.user.findMany({
			select: {
				name: true,
				boards: {
					select: {
						columns: { select: { tasks: { select: { id: true } } } },
					},
				},
			},
		});

		const tasksByUser = usersData.map((user) => {
			let totalTasks = 0;
			user.boards.forEach((board) => {
				board.columns.forEach((col) => {
					totalTasks += col.tasks.length;
				});
			});
			return { name: user.name, tasks: totalTasks };
		});

		res.json({ totalUsers, tasksByPriority, tasksByUser });
	} catch (error) {
		res.status(500).json({ error: "Error al calcular estadísticas" });
	}
});

// --- PERFIL ---

app.put("/profile", authenticateToken, async (req: AuthRequest, res) => {
	try {
		const { name, password } = req.body;
		const updateData: any = { name };

		if (password && password.trim() !== "") {
			if (password.length < 6) {
				res.status(400).json({ error: "Password muy corto" });
				return;
			}
			updateData.password = await bcrypt.hash(password, 10);
		}

		const updatedUser = await prisma.user.update({
			where: { id: req.userId! },
			data: updateData,
			select: { id: true, name: true, email: true, role: true },
		});
		res.json(updatedUser);
	} catch (error) {
		res.status(500).json({ error: "Error al actualizar perfil" });
	}
});

// --- ETIQUETAS ---

app.get("/tags", authenticateToken, async (req, res) => {
	const tags = await prisma.tag.findMany();
	res.json(tags);
});

app.post("/tags", authenticateToken, async (req, res) => {
	const newTag = await prisma.tag.create({
		data: { name: req.body.name, color: req.body.color },
	});
	res.json(newTag);
});

// --- SUBTAREAS ---

app.post("/tasks/:taskId/subtasks", authenticateToken, async (req, res) => {
	const subtask = await prisma.subtask.create({
		data: { content: req.body.content, taskId: Number(req.params.taskId) },
	});
	res.json(subtask);
});

app.patch("/subtasks/:id", authenticateToken, async (req, res) => {
	const updated = await prisma.subtask.update({
		where: { id: Number(req.params.id) },
		data: {
			isCompleted: req.body.isCompleted,
			content: req.body.content,
		},
	});
	res.json(updated);
});

app.delete("/subtasks/:id", authenticateToken, async (req, res) => {
	await prisma.subtask.delete({ where: { id: Number(req.params.id) } });
	res.json({ success: true });
});

// --- HISTORIAL ---

app.get("/tasks/:taskId/activity", authenticateToken, async (req, res) => {
	const logs = await prisma.activityLog.findMany({
		where: { taskId: Number(req.params.taskId) },
		include: { user: { select: { name: true } } },
		orderBy: { createdAt: "desc" },
	});
	res.json(logs);
});

// --- ADJUNTOS ---

app.post(
	"/tasks/:taskId/attachments",
	authenticateToken,
	upload.single("file"),
	async (req: AuthRequest, res: Response) => {
		try {
			const { taskId } = req.params;
			if (!req.file) {
				res.status(400).json({ error: "No se envió ningún archivo" });
				return;
			}

			const attachment = await prisma.attachment.create({
				data: {
					filename: req.file.originalname,
					path: req.file.path,
					taskId: Number(taskId),
				},
			});

			if (req.userId) {
				await logActivity(
					Number(taskId),
					req.userId,
					`Adjuntó el archivo: ${req.file.originalname}`,
				);
			}

			res.json(attachment);
		} catch (error) {
			res.status(500).json({ error: "Error al subir archivo" });
		}
	},
);

app.delete("/attachments/:id", authenticateToken, async (req, res) => {
	try {
		const attachment = await prisma.attachment.findUnique({
			where: { id: Number(req.params.id) },
		});
		if (attachment) {
			if (fs.existsSync(attachment.path)) {
				fs.unlinkSync(attachment.path);
			}
			await prisma.attachment.delete({ where: { id: Number(req.params.id) } });
		}
		res.json({ success: true });
	} catch (error) {
		res.status(500).json({ error: "Error al eliminar archivo" });
	}
});

app.listen(PORT, () =>
	console.log(`🚀 Servidor con Roles en http://localhost:${PORT}`),
);

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper para registrar actividad
async function logActivity(taskId: number, userId: number, action: string) {
  try {
    await prisma.activityLog.create({
      data: { taskId, userId, action },
    });
  } catch (e) {
    console.error('Error creando log:', e);
  }
}

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
const JWT_SECRET = 'mi_secreto_super_seguro';

app.use(express.json());
app.use(cors());

// --- TIPOS ---
interface AuthRequest extends Request {
  userId?: number;
  userRole?: string; // <--- Agregamos el rol al request
}

// --- MIDDLEWARES ---

// 1. Verificar Token (Para todos)
const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado' });
    return;
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Token inválido' });
      return;
    }

    // Buscamos al usuario para saber su rol actualizado
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no existe' });
      return;
    }

    req.userId = user.id;
    req.userRole = user.role; // Guardamos el rol
    next();
  });
};

// 2. Verificar si es ADMIN (Solo para rutas de gestión)
const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== 'ADMIN') {
    res.status(403).json({ error: 'Requiere privilegios de Administrador' });
    return;
  }
  next();
};

// --- RUTAS DE AUTH ---

// Login (Para todos)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '8h' });
    // Devolvemos el rol al frontend para saber si mostrar el Sidebar
    res.json({ token, name: user.name, role: user.role, userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Error en login' });
  }
});

// --- RUTAS DE ADMINISTRADOR (Gestión de Usuarios) ---

// 1. Crear Usuario (SOLO ADMIN) - Reemplaza al registro público
app.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creamos el usuario
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'USER', // Por defecto USER, pero el admin puede crear otros ADMINS
      },
    });

    // ¡IMPORTANTE! Le creamos un tablero vacío automáticamente
    await prisma.board.create({
      data: {
        title: `Tablero de ${name}`,
        ownerId: newUser.id,
        columns: {
          create: [
            { title: 'Pendiente', order: 0 },
            { title: 'En Proceso', order: 1 },
            { title: 'Terminado', order: 2 },
          ],
        },
      },
    });

    res.json(newUser);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al crear usuario (¿Email duplicado?)' });
  }
});

// 2. Obtener lista de todos los usuarios (SOLO ADMIN)
app.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }, // No enviamos el password
  });
  res.json(users);
});

// 3. Eliminar Usuario (SOLO ADMIN)

// 3. Eliminar Usuario (SOLO ADMIN)
// 3. Eliminar Usuario (SOLO ADMIN) - VERSIÓN "NUCLEAR"
app.delete(
  '/users/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const targetUserId = Number(id);

    // Evitar que el admin se borre a sí mismo
    if (targetUserId === req.userId) {
      res.status(400).json({ error: 'No puedes borrar tu propia cuenta' });
      return;
    }

    try {
      // PASO A: Identificar los IDs de los tableros de este usuario
      const userBoards = await prisma.board.findMany({
        where: { ownerId: targetUserId },
        select: { id: true }, // Solo necesitamos los IDs
      });

      const boardIds = userBoards.map((b) => b.id);

      // Si el usuario tiene tableros, procedemos a borrar su contenido
      if (boardIds.length > 0) {
        // PASO B: Borrar TODAS las TAREAS que están en columnas de esos tableros
        await prisma.task.deleteMany({
          where: {
            column: {
              boardId: { in: boardIds },
            },
          },
        });

        // PASO C: Borrar TODAS las COLUMNAS de esos tableros
        await prisma.column.deleteMany({
          where: {
            boardId: { in: boardIds },
          },
        });

        // PASO D: Ahora sí, borrar los TABLEROS (ya están vacíos)
        await prisma.board.deleteMany({
          where: { ownerId: targetUserId },
        });
      }

      // PASO E: FINALMENTE, borrar al USUARIO
      await prisma.user.delete({ where: { id: targetUserId } });

      res.json({ success: true });
    } catch (error) {
      console.error('Error al borrar usuario:', error);
      res.status(500).json({
        error: 'No se pudo eliminar al usuario (Error de base de datos)',
      });
    }
  }
);

// 4. Cambiar contraseña de usuario (SOLO ADMIN)
app.put(
  '/users/:id/password',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res
          .status(400)
          .json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: Number(id) },
        data: { password: hashedPassword }, // Solo actualizamos el password, no tocamos nada más
      });

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
    } catch (error) {
      res.status(500).json({ error: 'No se pudo cambiar la contraseña' });
    }
  }
);
// --- RUTAS DEL TABLERO (Modificadas para Admin) ---

// 1. Obtener Tableros (Actualizado con Tags y Subtasks)
app.get('/boards', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // ... (lógica de targetUserId igual que antes) ...
    let targetUserId = req.userId;
    if (req.query.userId && req.userRole === 'ADMIN') {
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
                subtasks: { orderBy: { id: 'asc' } }, // <--- AHORA INCLUIMOS SUBTAREAS
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tableros' });
  }
});

// Las demás rutas (Create/Update/Delete Task) ya funcionan porque el tablero
// se carga basado en el ID. Si el admin ve el tablero ID=5, y manda crear tarea
// en la columna ID=20 (que pertenece al tablero 5), Prisma lo permite.
// Solo necesitamos validar que el usuario tenga permiso de ver ese tablero,
// pero por simplicidad, si tienes el Token válido asumiremos que si eres Admin puedes tocar todo.

// Crear Tarea
// Crear Tarea (Actualizado)
app.post(
  '/tasks',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { content, columnId, priority, dueDate, tagIds } = req.body; // <--- tagIds

    const newTask = await prisma.task.create({
      data: {
        content,
        columnId: Number(columnId),
        priority: priority || 'low',
        dueDate: dueDate ? new Date(dueDate) : null,
        // Conectar etiquetas si vienen
        tags: tagIds
          ? {
              connect: tagIds.map((id: number) => ({ id })),
            }
          : undefined,
      },
      include: { tags: true }, // Para devolver la tarea creada YA con sus etiquetas
    });

    await logActivity(newTask.id, req.userId!, 'Creó la tarea');
    res.json(newTask);
  }
);

// Editar Tarea (Actualizado)
app.patch('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { columnId, content, priority, dueDate, tagIds } = req.body; // <--- tagIds

  const data: any = {};
  if (columnId !== undefined) data.columnId = Number(columnId);
  if (content !== undefined) data.content = content;
  if (priority !== undefined) data.priority = priority;
  if (dueDate !== undefined) data.dueDate = new Date(dueDate);

  // Actualizar etiquetas (Reemplaza las anteriores por las nuevas)
  if (tagIds !== undefined) {
    data.tags = {
      set: tagIds.map((tid: number) => ({ id: tid })),
    };
  }

  const updated = await prisma.task.update({
    where: { id: Number(id) },
    data,
    include: { tags: true },
  });
  res.json(updated);
});
// Mover Tarea / Editar Tarea
// Reemplaza tu ruta PATCH actual con esta versión mejorada:
app.patch('/tasks/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { columnId, content, priority, dueDate, tagIds } = req.body;
  const userId = req.userId!;

  // 1. Obtener tarea anterior para comparar (Ej: saber nombre de columna anterior)
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
    // Truco: Buscamos el nombre de la nueva columna
    const newCol = await prisma.column.findUnique({
      where: { id: Number(columnId) },
    });
    await logActivity(
      Number(id),
      userId,
      `Movió la tarea a lista: ${newCol?.title}`
    );
  }

  if (priority !== undefined && priority !== oldTask.priority) {
    await logActivity(Number(id), userId, `Cambió prioridad a: ${priority}`);
  }

  if (tagIds !== undefined) {
    await logActivity(Number(id), userId, 'Actualizó las etiquetas');
  }

  res.json(updated);
});

// Borrar Tarea
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  await prisma.task.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

// Reordenar Columnas
app.put('/columns/reorder', authenticateToken, async (req, res) => {
  const { columnIds } = req.body;
  const updates = columnIds.map((id: number, index: number) =>
    prisma.column.update({ where: { id: Number(id) }, data: { order: index } })
  );
  await prisma.$transaction(updates);
  res.json({ success: true });
});

// 5. Obtener comentarios de una tarea
app.get('/tasks/:taskId/comments', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { taskId: Number(taskId) },
      include: {
        user: { select: { id: true, name: true, role: true } }, // Traemos el nombre del autor
      },
      orderBy: { createdAt: 'asc' }, // Los más viejos primero (tipo chat)
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar comentarios' });
  }
});

// 6. Crear un comentario
app.post(
  '/tasks/:taskId/comments',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { taskId } = req.params;
      const { content } = req.body;

      const comment = await prisma.comment.create({
        data: {
          content,
          taskId: Number(taskId),
          userId: req.userId!, // El ID del usuario logueado
        },
        include: {
          user: { select: { name: true, role: true } },
        },
      });
      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: 'No se pudo enviar el comentario' });
    }
  }
);

// 7. Estadísticas para el Dashboard (SOLO ADMIN)
app.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Total de usuarios
    const totalUsers = await prisma.user.count();

    // 2. Tareas por Prioridad (Agrupadas)
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: { priority: true },
    });

    // 3. Tareas por Usuario (Calculado manualmente por la estructura de la DB)
    // Traemos usuarios con sus tableros, columnas y tareas
    const usersData = await prisma.user.findMany({
      select: {
        name: true,
        boards: {
          select: {
            columns: {
              select: {
                tasks: { select: { id: true } }, // Solo necesitamos contar
              },
            },
          },
        },
      },
    });

    // Procesamos los datos para aplanar la estructura: Usuario -> Total Tareas
    const tasksByUser = usersData.map((user) => {
      let totalTasks = 0;
      user.boards.forEach((board) => {
        board.columns.forEach((col) => {
          totalTasks += col.tasks.length;
        });
      });
      return { name: user.name, tasks: totalTasks };
    });

    res.json({
      totalUsers,
      tasksByPriority, // Ejemplo: [{ priority: 'high', _count: 5 }, ...]
      tasksByUser, // Ejemplo: [{ name: 'Juan', tasks: 10 }, ...]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
});

// 8. Actualizar MI Propio Perfil (Cualquier Usuario)
app.put(
  '/profile',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, password } = req.body;
      const userId = req.userId!;

      const updateData: any = { name };

      // Solo hasheamos si envió una nueva contraseña
      if (password && password.trim() !== '') {
        if (password.length < 6) {
          res
            .status(400)
            .json({ error: 'La contraseña debe tener al menos 6 caracteres' });
          return;
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, name: true, email: true, role: true }, // Devolvemos datos limpios
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
);

// 9. Gestión de Etiquetas
// Obtener todas las etiquetas disponibles
app.get('/tags', authenticateToken, async (req, res) => {
  const tags = await prisma.tag.findMany();
  res.json(tags);
});

// Crear nueva etiqueta (Solo Admin o cualquiera, tú decides. Aquí lo dejo abierto)
app.post('/tags', authenticateToken, async (req, res) => {
  const { name, color } = req.body;
  const newTag = await prisma.tag.create({
    data: { name, color },
  });
  res.json(newTag);
});

// 10. Gestión de Subtareas
// Crear Subtarea
app.post('/tasks/:taskId/subtasks', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const subtask = await prisma.subtask.create({
    data: { content, taskId: Number(taskId) },
  });
  res.json(subtask);
});

// Actualizar Subtarea (Marcar como completada / Cambiar texto)
app.patch('/subtasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { isCompleted, content } = req.body;
  const updated = await prisma.subtask.update({
    where: { id: Number(id) },
    data: { isCompleted, content },
  });
  res.json(updated);
});

// Eliminar Subtarea
app.delete('/subtasks/:id', authenticateToken, async (req, res) => {
  await prisma.subtask.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

// 11. Obtener historial de una tarea
app.get('/tasks/:taskId/activity', authenticateToken, async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    where: { taskId: Number(req.params.taskId) },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }, // Lo más reciente primero
  });
  res.json(logs);
});

app.listen(PORT, () =>
  console.log(`🚀 Servidor con Roles en http://localhost:${PORT}`)
);

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getIO } from '../lib/socket';

// --- HELPER PARA LOGS ---
const logActivity = async (taskId: number, userId: number, action: string) => {
  try {
    await prisma.activityLog.create({
      data: { taskId, userId, action },
    });
  } catch (error) {
    console.error('Error creando log de actividad:', error);
  }
};

// --- TAREAS PRINCIPALES ---

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { content, columnId, priority, dueDate, tagIds } = req.body;

    const task = await prisma.task.create({
      data: {
        content,
        columnId: Number(columnId),
        priority: priority || 'low',
        dueDate: dueDate ? new Date(dueDate) : null,
        // Conectar etiquetas si vienen en el body
        tags: tagIds
          ? { connect: tagIds.map((id: number) => ({ id })) }
          : undefined,
      },
      include: { tags: true },
    });

    // Logs y Socket
    await logActivity(task.id, req.userId!, 'Creó la tarea');
    getIO().emit('board:update', { action: 'createTask', taskId: task.id });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const taskId = Number(id);
    const { columnId, content, priority, dueDate, tagIds } = req.body;

    // 1. Obtener estado anterior para comparar (para los logs)
    const oldTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!oldTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // 2. Actualizar en DB
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        content,
        priority,
        // Manejo de fecha: si es null explícito se borra, si es undefined se ignora
        dueDate:
          dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
        columnId: columnId ? Number(columnId) : undefined,

        // Manejo de Etiquetas: 'set' reemplaza todas las relaciones actuales por las nuevas
        tags: tagIds
          ? { set: tagIds.map((tagId: number) => ({ id: tagId })) }
          : undefined,
      },
      include: { tags: true },
    });

    // 3. Generar Logs inteligentes
    if (columnId && oldTask.columnId !== Number(columnId)) {
      await logActivity(taskId, req.userId!, 'Movió la tarea de lista');
    }
    if (priority && oldTask.priority !== priority) {
      await logActivity(
        taskId,
        req.userId!,
        `Cambió la prioridad a ${priority}`,
      );
    }
    if (
      dueDate &&
      oldTask.dueDate?.toString() !== new Date(dueDate).toString()
    ) {
      await logActivity(
        taskId,
        req.userId!,
        'Actualizó la fecha de vencimiento',
      );
    }

    // 4. Notificar a todos por Socket
    getIO().emit('board:update', { action: 'updateTask', taskId: updated.id });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    await prisma.task.delete({ where: { id: taskId } });

    // Notificar eliminación
    getIO().emit('board:update', { action: 'deleteTask', taskId });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
};

// --- SUBTAREAS ---

export const createSubtask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const subtask = await prisma.subtask.create({
      data: { content: req.body.content, taskId: Number(taskId) },
    });
    res.json(subtask);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear subtask' });
  }
};

export const updateSubtask = async (req: Request, res: Response) => {
  try {
    const updated = await prisma.subtask.update({
      where: { id: Number(req.params.id) },
      data: { isCompleted: req.body.isCompleted, content: req.body.content },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar subtask' });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    await prisma.subtask.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar subtask' });
  }
};

// --- ADJUNTOS (ATTACHMENTS) ---

export const addAttachment = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
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
  } catch (error) {
    res.status(500).json({ error: 'Error al subir archivo' });
  }
};

export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    await prisma.attachment.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar adjunto' });
  }
};

// --- ACTIVIDAD ---

export const getActivity = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { taskId: Number(req.params.taskId) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
};

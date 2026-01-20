import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getComments = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { taskId: Number(taskId) },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    });

    const total = await prisma.comment.count({
      where: { taskId: Number(taskId) },
    });

    res.json({
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar comentarios' });
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
    res.status(500).json({ error: 'No se pudo enviar el comentario' });
  }
};

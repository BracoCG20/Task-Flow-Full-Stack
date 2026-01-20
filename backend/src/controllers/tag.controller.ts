import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getTags = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    // Validación básica
    if (!name || !color) {
      return res.status(400).json({ error: 'Nombre y color son requeridos' });
    }

    const tag = await prisma.tag.create({
      data: { name, color },
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear etiqueta' });
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.tag.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar etiqueta' });
  }
};

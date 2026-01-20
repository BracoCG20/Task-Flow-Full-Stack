import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'El contenido no puede estar vacío'),
    columnId: z.number({ required_error: 'Column ID es requerido' }),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().datetime().nullable().optional(), // Debe ser una fecha ISO válida si se envía
  }),
});

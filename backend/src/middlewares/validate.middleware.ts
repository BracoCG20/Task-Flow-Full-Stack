import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validamos body, query y params contra el esquema
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // ¡Todo bien! Pasa al controlador
    } catch (error) {
      if (error instanceof ZodError) {
        // Si falla, devolvemos un error 400 con los detalles
        return res.status(400).json({
          error: 'Error de validación',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };

import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import * as tagController from '../controllers/tag.controller';

const router = Router();

// Todas las rutas de tags requieren estar logueado
router.get('/', authenticateToken, tagController.getTags);
router.post('/', authenticateToken, tagController.createTag);
router.delete('/:id', authenticateToken, tagController.deleteTag);

export default router;

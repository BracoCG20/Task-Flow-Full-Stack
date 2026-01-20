import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import * as taskController from '../controllers/task.controller';
import commentRoutes from './comment.routes'; // Import comments router
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Importar validación
import { validate } from '../middlewares/validate.middleware';
import { createTaskSchema } from '../schemas/task.schema';

// Multer Config (Locally for now)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const router = Router();

// Basic Task CRUD
router.post(
  '/',
  authenticateToken,
  validate(createTaskSchema),
  taskController.createTask,
);
router.patch('/:id', authenticateToken, taskController.updateTask);
router.delete('/:id', authenticateToken, taskController.deleteTask);
router.get('/:taskId/activity', authenticateToken, taskController.getActivity);

// Subtasks
router.post(
  '/:taskId/subtasks',
  authenticateToken,
  taskController.createSubtask,
);

// Attachments
router.post(
  '/:taskId/attachments',
  authenticateToken,
  upload.single('file'),
  taskController.addAttachment,
);

// Nested Routes: Comments
// This tells Express: "For any route starting with /:taskId/comments, use commentRoutes"
router.use('/:taskId/comments', commentRoutes);

export default router;

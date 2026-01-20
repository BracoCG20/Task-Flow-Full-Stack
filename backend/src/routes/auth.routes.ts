import { Router } from 'express';
import { login } from '../controllers/auth.controller';

import { validate } from '../middlewares/validate.middleware';
import { loginSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login', login);
router.post('/login', validate(loginSchema), login);
export default router;

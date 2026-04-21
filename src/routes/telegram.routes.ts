import { Router } from 'express';
import { generateLinkToTelegram } from '../controllers/telegram.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/generate-link', authMiddleware, generateLinkToTelegram);

export default router;

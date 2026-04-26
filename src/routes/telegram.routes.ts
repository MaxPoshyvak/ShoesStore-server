import { Router } from 'express';
import { generateLinkToTelegram, sendSupportMessage, getHistory, getChats } from '../controllers/telegram.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

router.get('/generate-link/:bot', authMiddleware, generateLinkToTelegram);
router.post('/send-support-message', authMiddleware, adminMiddleware, sendSupportMessage);
router.get('/get-history/:chatId', authMiddleware, adminMiddleware, getHistory);
router.get('/get-support-chats/', authMiddleware, adminMiddleware, getChats);

export default router;

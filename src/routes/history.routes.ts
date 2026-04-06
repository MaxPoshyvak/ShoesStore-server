import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { addHistory, getHistory } from '../controllers/history.controller';

const router = Router();

router.post('/add', authMiddleware, addHistory);
router.get('/get', authMiddleware, getHistory);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { addFeedbacks, getFeedbacks } from '../controllers/feedbacks.controller';

const router = Router();

router.post('/add', authMiddleware, addFeedbacks);
router.get('/get', authMiddleware, getFeedbacks);

export default router;

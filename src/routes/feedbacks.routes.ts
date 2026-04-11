import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { addFeedbacks, getFeedbacks } from '../controllers/feedbacks.controller';

const router = Router();

router.post('/add', authMiddleware, addFeedbacks);
router.get('/get', getFeedbacks);

export default router;

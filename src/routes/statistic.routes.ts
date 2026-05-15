import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getStatistic, getActivity } from '../controllers/statistic.controller';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

router.post('/activty/get', authMiddleware, adminMiddleware, getActivity);
router.get('/get', authMiddleware, adminMiddleware, getStatistic);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { addSearchInfo, getSearchInfo } from '../controllers/searchInfo.controller';

const router = Router();

router.post('/add', authMiddleware, addSearchInfo);
router.get('/get', authMiddleware, getSearchInfo);

export default router;

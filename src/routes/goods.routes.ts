import { Router } from 'express';
import { getGoods, postGoods } from '../controllers/goods.controller';
import { validateGoodCreation } from '../middlewares/goodsValidation';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
const router = Router();

router.get('/', getGoods);
router.post('/', validateGoodCreation, authMiddleware, adminMiddleware, postGoods);

export default router;

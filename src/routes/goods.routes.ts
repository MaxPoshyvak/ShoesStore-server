import { Router } from 'express';
import {
    getGoods,
    postGoods,
    getGoodById,
    updateGood,
    updateGoodStock,
    deleteGood,
} from '../controllers/goods.controller';
import { validateGoodCreation } from '../middlewares/goodsValidation';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
const router = Router();

router.get('/', getGoods);
router.get('/:id', getGoodById);
router.post('/', validateGoodCreation, authMiddleware, adminMiddleware, postGoods);
router.delete('/:id', authMiddleware, adminMiddleware, deleteGood);

router.put('/:id', validateGoodCreation, authMiddleware, adminMiddleware, updateGood);
router.patch('/stock/:id', authMiddleware, adminMiddleware, updateGoodStock);

export default router;

import { Router } from 'express';
import {
    getGoods,
    postGoods,
    getGoodById,
    updateGood,
    updateGoodStock,
    deleteGood,
    getGoodsBySearchQuery,
} from '../controllers/goods.controller';
import { validateGoodCreation } from '../middlewares/goodsValidation';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { optionalAuthMiddleware } from '../middlewares/optionalAuthMiddleware';
const router = Router();

router.get('/', optionalAuthMiddleware, getGoods);
router.get('/search/:q', getGoodsBySearchQuery);

router.get('/:id', getGoodById);

router.post('/', validateGoodCreation, authMiddleware, adminMiddleware, postGoods);
router.delete('/:id', authMiddleware, adminMiddleware, deleteGood);

router.put('/:id', validateGoodCreation, authMiddleware, adminMiddleware, updateGood);
router.patch('/stock/:id', authMiddleware, adminMiddleware, updateGoodStock);

export default router;

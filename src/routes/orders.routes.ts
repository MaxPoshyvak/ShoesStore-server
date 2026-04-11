import { Router } from 'express';
import { postOrders, getOrders, getOrderById } from '../controllers/orders.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { optionalAuthMiddleware } from '../middlewares/optionalAuthMiddleware';

const router = Router();

router.post('/', optionalAuthMiddleware, postOrders);
router.get('/', authMiddleware, adminMiddleware, getOrders);
router.get('/:id', authMiddleware, adminMiddleware, getOrderById);

export default router;

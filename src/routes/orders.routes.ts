import { Router } from 'express';
import { postOrders } from '../controllers/orders.controller';

const router = Router();

router.post('/', postOrders);

// router.get('/', getOrders);

export default router;

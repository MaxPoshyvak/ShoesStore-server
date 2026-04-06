import { Router } from 'express';
import { createPayment } from '../controllers/payments.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/create/:orderId', authMiddleware, createPayment);

export default router;

import { Router } from 'express';
import { createPayment, getPayments } from '../controllers/payments.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

router.post('/create/:orderId', authMiddleware, createPayment);
router.get('/get', authMiddleware, adminMiddleware, getPayments);

export default router;

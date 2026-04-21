import { Router } from 'express';
import usersRoutes from './users.routes';
import ordersRoutes from './orders.routes';
import goodsRoutes from './goods.routes';
import paymentsRoutes from './payments.routes';
import historyRoutes from './history.routes';
import searchInfoRoutes from './searchInfo.routes';
import feedbacksRoutes from './feedbacks.routes';
import waitlistRoutes from './waitlist.routes';
import telegramRoutes from './telegram.routes';

const router = Router();

router.use('/users', usersRoutes);
router.use('/orders', ordersRoutes);
router.use('/goods', goodsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/telegram', telegramRoutes);

router.use('/history', historyRoutes);
router.use('/search-info', searchInfoRoutes);
router.use('/feedbacks', feedbacksRoutes);

export default router;

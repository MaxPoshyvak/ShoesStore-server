import { Router } from 'express';
import usersRoutes from './users.routes';
import ordersRoutes from './orders.routes';
import goodsRoutes from './goods.routes';
import paymentsRoutes from './payments.routes';

const router = Router();

router.use('/users', usersRoutes);
router.use('/orders', ordersRoutes);
router.use('/goods', goodsRoutes);
router.use('/payments', paymentsRoutes);

export default router;

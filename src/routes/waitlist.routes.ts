import { Router } from 'express';
import { addToWaitlist } from '../controllers/waitlst.controller';
import addToWaitlistLimiter from '../middlewares/rateLimits/addToWaitlistLimiter';

const router = Router();

router.post('/', addToWaitlistLimiter, addToWaitlist);

export default router;

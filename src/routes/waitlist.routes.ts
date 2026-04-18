import { Router } from 'express';
import { addToWaitlist } from '../controllers/waitlst.controller';

const router = Router();

router.post('/', addToWaitlist);

export default router;

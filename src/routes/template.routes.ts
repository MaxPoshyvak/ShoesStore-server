import { Router } from 'express';
import { template } from '../controllers/template.controller';

const router = Router();

router.get('/', template);

export default router;

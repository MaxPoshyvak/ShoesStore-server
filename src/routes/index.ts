import { Router } from 'express';
import template from './template.routes';

const router = Router();

router.use(template);

export default router;

import { Router } from 'express';
import { userRegistration, userLogin, getUsers } from '../controllers/users.controller';
import { validateUserLogin, validateUserRegistration } from '../middlewares/userValidation';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

router.post('/registration', validateUserRegistration, userRegistration);
router.post('/login', validateUserLogin, userLogin);

router.get('/', authMiddleware, adminMiddleware, getUsers);

export default router;

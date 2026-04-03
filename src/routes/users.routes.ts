import { Router } from 'express';
import { userRegistration, userLogin, getUsers } from '../controllers/users.controller';
import { validateUserLogin, validateUserRegistration } from '../middlewares/userValidation';

const router = Router();

router.post('/registration', validateUserRegistration, userRegistration);
router.post('/login', validateUserLogin, userLogin);

router.get('/', getUsers);

export default router;

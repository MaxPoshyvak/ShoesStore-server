import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { addFavorites, getFavorites, deleteFavorites } from '../controllers/favorites.controller';

const router = Router();

router.post('/add', authMiddleware, addFavorites);
router.get('/get', authMiddleware, getFavorites);
router.delete('/remove/:goodId', authMiddleware, deleteFavorites);

export default router;

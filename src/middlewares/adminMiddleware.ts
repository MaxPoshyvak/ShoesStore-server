import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Розширюємо стандартний Request, додаючи туди нашого юзера
export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        role: string;
    };
}

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Ми точно знаємо, що req.user тут є, якщо authMiddleware відпрацював успішно
    const user = req.user;

    if (user && user.role === 'admin') {
        next(); // Все ок, це адмін, пускаємо до контролера
    } else {
        res.status(403).json({ message: 'Доступ заборонено. Потрібні права адміністратора.' });
    }
};

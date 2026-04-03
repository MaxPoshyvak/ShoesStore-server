import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/dataBase/postgreSQL';

// Розширюємо стандартний Request, додаючи туди нашого юзера
export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        role: string;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Токен відсутній. Доступ заборонено' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'JWT_SECRET is not defined' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;

        if (!decodedUser || !decodedUser.email) {
            return res.status(401).json({ message: 'Невірний формат токена' });
        }

        // Шукаємо юзера в базі
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [decodedUser.email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Користувача не знайдено' });
        }

        // ПРИЧІПЛЯЄМО ЮЗЕРА ДО ЗАПИТУ
        req.user = user;

        // Передаємо естафету далі
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        return res.status(401).json({ message: 'Невалідний або прострочений токен' });
    }
};

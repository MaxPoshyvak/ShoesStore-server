// middlewares.ts (або де у тебе лежать мідлвари)
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/dataBase/postgreSQL';

export interface AuthRequest extends Request {
    user?: {
        id: string | number;
        username: string;
        email: string;
        role: string;
    };
}

export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Якщо токена немає взагалі — просто йдемо далі (це гість)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [decodedUser.email]);
        const user = result.rows[0];

        // Якщо токен є і юзер справжній — чіпляємо його до запиту
        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        // Якщо токен прострочений або невалідний — краще сказати про це
        return res.status(401).json({ message: 'Невалідний або прострочений токен' });
    }
};

import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';
import jwt from 'jsonwebtoken';

export const addToWaitlist = async (req: Request, res: Response): Promise<void> => {
    const { good_id, email } = req.body;

    const headers = req.headers.authorization;

    if (!good_id) {
        res.status(400).json({ error: 'good_id is required' });
        return;
    }

    try {
        if (!headers || !headers.startsWith('Bearer ')) {
            if (!email) {
                res.status(400).json({ error: 'Для неавторизованих користувачів потрібен email' });
                return;
            }

            const result = await pool.query('INSERT INTO waitlist (good_id, email) VALUES ($1, $2) RETURNING *', [
                good_id,
                email,
            ]);

            res.status(201).json(result.rows[0]);
            return;
        }

        const token = headers.split(' ')[1];

        const decodedUser = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;

        const user = await pool.query('SELECT * FROM users WHERE email = $1', [decodedUser.email]);

        const result = await pool.query('INSERT INTO waitlist (good_id, email) VALUES ($1, $2) RETURNING *', [
            good_id,
            user.rows[0].email,
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

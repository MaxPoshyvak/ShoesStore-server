import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { RequestWithUser } from '../types';
import pool from '../config/dataBase/postgreSQL';

export const generateLinkToTelegram = async (req: RequestWithUser, res: Response) => {
    const authToken = uuidv4();

    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const setTokenForUser = await pool.query(
            'UPDATE users SET telegram_auth_token = $1 WHERE id = $2 RETURNING *',
            [authToken, user.id],
        );

        if (setTokenForUser.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Telegram link generated successfully',
            link: `https://t.me/ShoesStoreSlickBot?start=${authToken}`,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error generating Telegram link' });
    }
};

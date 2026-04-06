import { Request, Response } from 'express';
import History from '../models/History';
import type { RequestWithUser } from '../types';
import pool from '../config/dataBase/postgreSQL';

export const addHistory = async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;
    try {
        const { goodId } = req.body;

        if (!userId || !goodId) {
            return res.status(400).json({ message: 'userId and goodId are required' });
        }

        const historyEntry = new History({ userId, goodId });
        await historyEntry.save();

        res.status(201).json({ message: 'History entry added successfully', history: historyEntry });
    } catch (error) {
        console.error('Error adding history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getHistory = async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;

    try {
        const historyEntries = await History.find({ userId }).sort({ viewedAt: -1 });

        const hisroryIds = historyEntries.map((entry) => entry.goodId);

        const goodsResult = await pool.query('SELECT * FROM goods WHERE id = ANY($1)', [hisroryIds]);

        goodsResult.rows.forEach((good: any) => {
            const historyEntry = historyEntries.find((entry) => entry.goodId === good.id);
            if (historyEntry) {
                good.viewedAt = historyEntry.viewedAt;
            }
        });
        res.status(200).json({ history: goodsResult.rows });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

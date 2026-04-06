import { Response } from 'express';
import type { RequestWithUser } from '../types';
import Feedback from '../models/Feedback';
import pool from '../config/dataBase/postgreSQL';

export const getFeedbacks = async (req: RequestWithUser, res: Response) => {
    try {
        const feedbacks = await Feedback.find();
        res.status(200).json({ feedbacks });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const addFeedbacks = async (req: RequestWithUser, res: Response) => {
    const { comment, rating, goodId } = req.body;
    const userId = req.user?.id;

    if (!comment || !rating || !goodId) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    try {
        const goodExist = await pool.query('SELECT id FROM goods WHERE id = $1', [goodId]);
        if (goodExist.rowCount === 0) {
            return res.status(404).json({ message: 'Good not found' });
        }

        const feedback = new Feedback({ comment, rating, goodId, userId });
        await feedback.save();
        res.status(201).json({ message: 'Feedback added successfully', feedback });
    } catch (error) {
        console.error('Error adding feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

import Favorites from '../models/Favorites';
import { Request, Response } from 'express';
import { RequestWithUser } from '../types';
import pool from '../config/dataBase/postgreSQL';

export const addFavorites = async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;
    try {
        const { goodId } = req.body;
        if (!goodId) {
            return res.status(400).json({ message: 'GoodId is required' });
        }

        const goodFromDb = await pool.query('SELECT * FROM goods WHERE id = $1', [goodId]);

        if (goodFromDb.rows.length === 0) {
            return res.status(404).json({ message: 'Good not found' });
        }

        const good = goodFromDb.rows[0];

        const existingFavorite = await Favorites.findOne({ userId, goodId });

        if (existingFavorite) {
            return res.json({ message: 'Already in favorites' });
        }

        const newFavorite = new Favorites({
            userId,
            goodId,
            goodName: good.name,
            goodPrice: good.price,
            goodImage: good.main_image_url,
            oldPrice: good.old_price,
            category: good.category,
            is_new: good.is_new,
            stock_quantity: good.stock_quantity,
            sizes: good.sizes,
        });
        await newFavorite.save();
        res.status(201).json({ message: 'Added to favorites successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add to favorites', error });
    }
};

export const getFavorites = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = req.user?.id;
        const favorites = await Favorites.find({ userId });
        res.status(200).json({ message: 'Favorites retrieved successfully', favorites });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve favorites', error });
    }
};

export const deleteFavorites = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = req.user?.id;
        const goodId = Number(req.params.goodId);

        if (Number.isNaN(goodId)) {
            return res.status(400).json({ message: 'Invalid favorite id', goodId });
        }

        const deletedFavorite = await Favorites.findOneAndDelete({ goodId, userId });

        if (!deletedFavorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        res.status(200).json({ message: 'Removed from favorites successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove from favorites', error });
    }
};

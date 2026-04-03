import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';
import { json } from 'stream/consumers';

export const getGoods = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM goods');

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching goods:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const postGoods = async (req: Request, res: Response) => {
    const {
        name,
        description,
        price,
        old_price,
        category,
        is_new,
        stock_quantity,
        sizes,
        main_image_url,
        gallery_urls,
    } = req.body;

    try {
        const newGood = {
            name,
            description,
            price,
            old_price,
            category,
            is_new,
            stock_quantity,
            sizes,
            main_image_url,
            gallery_urls,
        };

        const result = await pool.query(
            'INSERT INTO goods (name, description, price, old_price, category, is_new, stock_quantity, sizes, main_image_url, gallery_urls) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [
                newGood.name,
                newGood.description,
                newGood.price,
                newGood.old_price,
                newGood.category,
                newGood.is_new,
                newGood.stock_quantity,
                JSON.stringify(newGood.sizes),
                newGood.main_image_url,
                JSON.stringify(newGood.gallery_urls),
            ],
        );

        const createdGood = result.rows[0];

        res.status(201).json({ message: 'Goods created', good: createdGood });
    } catch (error) {
        console.error('Error during posting goods:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

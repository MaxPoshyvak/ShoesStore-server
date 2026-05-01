import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';
import { sendRestockEmail } from '../utils/email.service';

const checkAndNotifyWaitlist = async (goodId: string, newStock: number) => {
    if (newStock > 0) {
        const waitingUsers = await pool.query(
            "SELECT id, email FROM waitlist WHERE good_id = $1 AND status = 'pending'",
            [goodId],
        );

        if (waitingUsers.rows.length > 0) {
            const emails = waitingUsers.rows.map((user) => user.email);
            const waitingUserIds = waitingUsers.rows.map((user) => user.id);

            await sendRestockEmail(emails, goodId);

            await pool.query("UPDATE waitlist SET status = 'notified' WHERE id = ANY($1)", [waitingUserIds]);

            console.log(`Notify ${waitingUsers.rows.length} users about restocked good with id ${goodId}`);
        }
    }
};
// ------------------------------------

export const getGoods = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM goods ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching goods:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getGoodById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM goods WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Good not found' });
        }
        res.status(200).json({ good: result.rows[0] });
    } catch (error) {
        console.error('Error fetching good by id:', error);
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
        const result = await pool.query(
            `INSERT INTO goods (name, description, price, old_price, category, is_new, stock_quantity, sizes, main_image_url, gallery_urls) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                name,
                description,
                price,
                old_price,
                category,
                is_new,
                stock_quantity,
                JSON.stringify(sizes as string[]),
                main_image_url,
                JSON.stringify(gallery_urls),
            ],
        );

        res.status(201).json({ message: 'Goods created', good: result.rows[0] });
    } catch (error) {
        console.error('Error during posting goods:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateGood = async (req: Request, res: Response) => {
    const { id } = req.params;
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
        const result = await pool.query(
            `UPDATE goods SET name = $1, description = $2, price = $3, old_price = $4, category = $5, 
             is_new = $6, stock_quantity = $7, sizes = $8, main_image_url = $9, gallery_urls = $10 
             WHERE id = $11 RETURNING *`,
            [
                name,
                description,
                price,
                old_price,
                category,
                is_new,
                stock_quantity,
                JSON.stringify(sizes as string[]),
                main_image_url,
                JSON.stringify(gallery_urls),
                id,
            ],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Good not found' });
        }

        checkAndNotifyWaitlist(id, stock_quantity).catch((err) => {
            console.error('Помилка фонової розсилки листів:', err);
        });

        res.status(200).json({ message: 'Goods updated', good: result.rows[0] });
    } catch (error) {
        console.error('Error during updating goods:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateGoodStock = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newStock } = req.body;

    if (newStock === undefined || newStock === null || newStock < 0) {
        return res.status(400).json({ message: 'Valid new stock quantity is required', newStock: newStock });
    }

    try {
        const result = await pool.query('UPDATE goods SET stock_quantity = $1 WHERE id = $2 RETURNING *', [
            newStock,
            id,
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Good not found' });
        }

        // Знову використовуємо допоміжну функцію
        checkAndNotifyWaitlist(id, newStock).catch((err) => {
            console.error('Помилка фонової розсилки листів:', err);
        });

        res.status(200).json({ message: 'Good stock updated', good: result.rows[0] });
    } catch (error) {
        console.error('Error during updating good stock:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteGood = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM goods WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Good not found' });
        }
        res.status(200).json({ message: 'Good deleted', good: result.rows[0] });
    } catch (error) {
        console.error('Error during deleting good:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';

interface RequestWithUser extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        role: string;
    };
}

export const postOrders = async (req: RequestWithUser, res: Response): Promise<void> => {
    const { shipping_address, payment_method, customer_notes, items } = req.body;

    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const userId = req.user.id;

    try {
        const itemsFromDB = await pool.query('SELECT id, name, price, stock_quantity FROM goods WHERE id = ANY($1)', [
            items.map((item: any) => item.good_id),
        ]);

        if (itemsFromDB.rows.length !== items.length) {
            res.status(400).json({ error: 'One or more goods not found in database' });
            return;
        }

        const orderItems = items.map((reqItem: any) => {
            const dbItem = itemsFromDB.rows.find((row) => row.id === reqItem.good_id);

            return {
                good_id: dbItem.id,
                price: dbItem.price,
                requested_quantity: reqItem.quantity,
                stock_quantity: dbItem.stock_quantity,
            };
        });

        const outOfStockItem = orderItems.find((item: any) => item.requested_quantity > item.stock_quantity);
        if (outOfStockItem) {
            res.status(400).json({ error: `Not enough stock for item ID: ${outOfStockItem.good_id}` });
            return;
        }

        const total_amount = orderItems.reduce(
            (total: number, item: any) => total + item.price * item.requested_quantity,
            0,
        );

        const result = await pool.query(
            'INSERT INTO orders (user_id, shipping_address, payment_method, customer_notes, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, shipping_address, payment_method, customer_notes, total_amount],
        );

        const newOrderId = result.rows[0].id;

        const setOrderItems = orderItems.map((item: any) => {
            return pool.query(
                'INSERT INTO order_items (order_id, good_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
                [newOrderId, item.good_id, item.requested_quantity, item.price],
            );
        });

        await Promise.all(setOrderItems);

        const updateStockQueries = orderItems.map((item: any) => {
            return pool.query('UPDATE goods SET stock_quantity = stock_quantity - $1 WHERE id = $2', [
                item.requested_quantity,
                item.good_id,
            ]);
        });
        await Promise.all(updateStockQueries);

        res.status(201).json({ message: 'Order created successfully', order: result.rows[0] });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const ordersResult = await pool.query(`
            SELECT 
                o.id, 
                o.total_amount, 
                o.status, 
                o.payment_method, 
                o.payment_status, 
                o.shipping_address, 
                o.customer_notes,
                o.created_at,
                u.email as customer_email,
                u.username as customer_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);

        const orders = ordersResult.rows;

        if (orders.length === 0) {
            res.status(200).json([]);
            return;
        }

        const orderIds = orders.map((order) => order.id);

        const itemsResult = await pool.query(
            `
            SELECT 
                oi.order_id,          -- Важливо: нам потрібен order_id, щоб знати, куди покласти товар
                oi.good_id, 
                oi.quantity, 
                oi.price_at_purchase, 
                g.name, 
                g.main_image_url
            FROM order_items oi
            JOIN goods g ON oi.good_id = g.id
            WHERE oi.order_id = ANY($1)
        `,
            [orderIds],
        );

        const allItems = itemsResult.rows;

        const fullOrders = orders.map((order) => {
            return {
                ...order,
                items: allItems.filter((item) => item.order_id === order.id),
            };
        });

        res.status(200).json(fullOrders);
    } catch (error) {
        console.error('Помилка в адмінці при отриманні замовлень:', error);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    const orderId = req.params.id;

    try {
        const orderResult = await pool.query(
            `
            SELECT 
                o.*, 
                u.email as customer_email,
                u.username as customer_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `,
            [orderId],
        );

        const order = orderResult.rows[0];

        if (!order) {
            res.status(404).json({ error: 'Замовлення не знайдено' });
            return;
        }

        const itemsResult = await pool.query(
            `
            SELECT 
                oi.good_id, 
                oi.quantity, 
                oi.price_at_purchase, 
                g.name, 
                g.main_image_url
            FROM order_items oi
            JOIN goods g ON oi.good_id = g.id
            WHERE oi.order_id = $1
        `,
            [orderId],
        );

        const fullOrder = {
            ...order,
            items: itemsResult.rows,
        };

        res.status(200).json(fullOrder);
    } catch (error) {
        console.error('Помилка при отриманні деталей замовлення (Адмін):', error);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
};

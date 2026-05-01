import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';
import type { RequestWithUser } from '../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const postOrders = async (req: RequestWithUser, res: Response): Promise<void> => {
    // Додали email, username та password, які можуть прийти від неавторизованого юзера
    const { shipping_address, payment_method, customer_notes, items, email, username, password } = req.body;

    let userId: string | number;

    try {
        // --- 1. ЛОГІКА АВТОРИЗАЦІЇ АБО РЕЄСТРАЦІЇ ---
        if (req.user) {
            // Юзер авторизований
            userId = req.user.id;
        } else {
            // Юзер не авторизований (гість). Створюємо йому акаунт.
            if (!email || !username || !password) {
                res.status(400).json({ error: 'Для замовлення без авторизації потрібні email, username та password' });
                return;
            }
            const userRegId = uuidv4();

            // Перевіряємо, чи не зайнятий email
            const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                res.status(400).json({ error: 'Користувач з таким email вже існує. Будь ласка, увійдіть в акаунт.' });
                return;
            }

            // Хешуємо пароль
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Створюємо нового користувача (роль за замовчуванням 'user')
            const newUser = await pool.query(
                'INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [userRegId, username, email, hashedPassword, 'user'],
            );

            userId = newUser.rows[0].id;
        }

        // --- 2. СТАНДАРТНА ЛОГІКА СТВОРЕННЯ ЗАМОВЛЕННЯ ---
        // Тепер у нас 100% є userId (або старий, або щойно створений)

        const itemsFromDB = await pool.query(
            'SELECT id, name, price, stock_quantity, sizes FROM goods WHERE id = ANY($1)',
            [items.map((item: any) => item.good_id)],
        );

        const orderItems = items.map((reqItem: any) => {
            // 1. Приводимо id до рядків для безпечного порівняння
            const dbItem = itemsFromDB.rows.find((row) => String(row.id) === String(reqItem.good_id));

            // 2. СПОЧАТКУ перевіряємо чи є товар, а вже потім дістаємо його властивості
            if (!dbItem) {
                // Викидаємо спеціальну помилку (додамо маркер 'VALIDATION_ERROR', щоб відловити її в catch)
                const err = new Error(`Товар з ID ${reqItem.good_id} не знайдено`);
                err.name = 'VALIDATION_ERROR';
                throw err;
            }

            const availableSizes = (dbItem.sizes || []).map(String);
            const requestedSize = String(reqItem.size);

            if (!availableSizes.includes(requestedSize)) {
                const err = new Error(`Розмір ${reqItem.size} недоступний для товару "${dbItem.name}"`);
                err.name = 'VALIDATION_ERROR';
                throw err;
            }

            return {
                good_id: dbItem.id,
                price: dbItem.price,
                size: reqItem.size,
                requested_quantity: reqItem.quantity,
                stock_quantity: dbItem.stock_quantity,
            };
        });

        const outOfStockItem = orderItems.find((item: any) => item.requested_quantity > item.stock_quantity);
        if (outOfStockItem) {
            res.status(400).json({ error: `Недостатньо товару на складі для ID: ${outOfStockItem.good_id}` });
            return;
        }

        const total_amount = orderItems.reduce(
            (total: number, item: any) => total + item.price * item.requested_quantity,
            0,
        );

        // Створюємо замовлення
        const result = await pool.query(
            'INSERT INTO orders (user_id, shipping_address, payment_method, customer_notes, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, shipping_address, payment_method, customer_notes, total_amount],
        );

        const newOrderId = result.rows[0].id;

        // Додаємо товари в order_items
        const setOrderItems = orderItems.map((item: any) => {
            return pool.query(
                'INSERT INTO order_items (order_id, good_id, quantity, price_at_purchase, size) VALUES ($1, $2, $3, $4, $5)',
                [newOrderId, item.good_id, item.requested_quantity, item.price, item.size as string],
            );
        });
        await Promise.all(setOrderItems);

        // Віднімаємо залишки на складі
        const updateStockQueries = orderItems.map((item: any) => {
            return pool.query('UPDATE goods SET stock_quantity = stock_quantity - $1 WHERE id = $2', [
                item.requested_quantity,
                item.good_id,
            ]);
        });
        await Promise.all(updateStockQueries);

        res.status(201).json({ message: 'Замовлення успішно створено', order: result.rows[0] });
    } catch (error: unknown) {
        console.error('Error creating order:', error);

        // 4. ТЕПЕР МИ ПРАВИЛЬНО ОБРОБЛЯЄМО ПОМИЛКИ ВАЛІДАЦІЇ
        if (error instanceof Error && error.name === 'VALIDATION_ERROR') {
            res.status(400).json({ error: error.message });
            return; // Обов'язково робимо return
        }

        res.status(500).json({ error: 'Внутрішня помилка сервера' });
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
                oi.size,
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
                oi.size,
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

export const getOrderByUserId = async (req: RequestWithUser, res: Response): Promise<void> => {
    const userId = req.params.userId;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const ordersResult = await pool.query(
            `
            SELECT 
                o.id, 
                o.total_amount, 
                o.status, 
                o.payment_method, 
                o.payment_status, 
                o.shipping_address, 
                o.customer_notes,
                o.created_at
            FROM orders o
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC
        `,
            [userId],
        );

        const orders = ordersResult.rows;

        if (orders.length === 0) {
            res.status(200).json([]);
            return;
        }

        const orderIds = orders.map((order) => order.id);

        const itemsResult = await pool.query(
            `
            SELECT 
                oi.order_id,         
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
        console.error('Помилка при отриманні замовлень користувача:', error);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
};

import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { RequestWithUser } from '../types';
import Feedback from '../models/Feedback';

export const userRegistration = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    const userId = uuidv4();

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'JWT_SECRET is not defined in environment variables' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (existUser && existUser.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const newUser = await pool.query(
            'INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, username, email, hashedPassword],
        );
        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const userLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'JWT_SECRET is not defined in environment variables' });
    }

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (!user || user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.rows[0].id, email: user.rows[0].email }, process.env.JWT_SECRET, {
            expiresIn: '12h',
        });

        res.status(200).json({ message: 'Login successful', token, user: user.rows[0] });
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await pool.query('SELECT id, username, email, role, created_at FROM users');
        res.status(200).json(users.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMe = async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;

    try {
        // 1. Запускаємо ПАРАЛЕЛЬНО запити до PostgreSQL
        const [userResult, ordersResult] = await Promise.all([
            // Витягуємо юзера (робимо username as name для фронтенду)
            pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [userId]),

            // Витягуємо замовлення з таблиці goods (використовуємо g.name та g.image_url)
            pool.query(
                `
                SELECT o.id, o.created_at as date, o.status, o.total_amount as total,
                       json_agg(json_build_object(
                           'name', g.name, 
                           'price', g.price, 
                           'sizes', g.sizes, 
                           'image', g.main_image_url,
                           'quantity', oi.quantity
                       )) as items
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN goods g ON oi.good_id = g.id
                WHERE o.user_id = $1
                GROUP BY o.id
                ORDER BY o.created_at DESC
                `,
                [userId],
            ),
        ]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        // 2. Витягуємо відгуки з MongoDB
        const feedbacksResult = await Feedback.find({ userId: userId }).exec();

        // Мапимо відгуки так, щоб фронтенд їх ідеально "з'їв"
        const reviews = feedbacksResult.map((feedback) => ({
            id: feedback._id, // У Mongo це _id, але для React map(key) треба id
            text: feedback.comment,
            rating: feedback.rating,
            productName: feedback.goodName,
            date: feedback.createdAt,
        }));

        // 3. Збираємо фінальний об'єкт профілю
        const finalProfile = {
            ...userResult.rows[0], // id, name, email, created_at
            orders: ordersResult.rows, // масив замовлень
            reviews: reviews, // масив відгуків з Mongo
        };

        res.status(200).json({ user: finalProfile });
    } catch (error) {
        console.error('Помилка отримання профілю:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

export const editUser = async (req: RequestWithUser, res: Response) => {
    // 1. Беремо ID юзера з токена (з req.user)
    const userId = req.user?.id;

    // 2. Дістаємо дані, які юзер МОЖЛИВО прислав
    // Якщо чогось немає, воно буде undefined
    const { username, email } = req.body;

    try {
        // 3. Робимо магічний SQL запит
        const updatedUser = await pool.query(
            `UPDATE users 
             SET 
                username = COALESCE($1, username), 
                email = COALESCE($2, email),
                updated_at = NOW()
             WHERE id = $3 
             RETURNING id, username, email`, // Повертаємо оновлені дані (БЕЗ ПАРОЛЯ!)
            [username, email, userId],
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser.rows[0],
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

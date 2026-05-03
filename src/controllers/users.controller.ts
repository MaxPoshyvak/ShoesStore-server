import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { RequestWithUser } from '../types';
import Feedback from '../models/Feedback';
import { sendVerificationEmail } from '../utils/email.service';
import crypto from 'crypto';

function generateCode(length = 4) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = crypto.randomBytes(length);

    return Array.from(bytes)
        .map((b) => chars[b % chars.length])
        .join('');
}

export const userRegistration = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    const userId = uuidv4();
    const verificationToken = generateCode();
    const tokenExpiration = new Date(Date.now() + 12 * 60 * 60 * 1000);

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
            'INSERT INTO users (id, username, email, password, verification_token, token_expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, username, email, hashedPassword, verificationToken, tokenExpiration],
        );
        await sendVerificationEmail(email, verificationToken);
        res.status(201).json({
            message: 'User registered successfully. Please check your email for verification.',
            user: newUser.rows[0],
        });
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

        if (!user.rows[0].email_verified) {
            return res.status(400).json({
                message: 'Please verify your email first',
                email: user.rows[0].email,
            });
        }

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
            pool.query('SELECT id, username, email, phone, delivery_address FROM users WHERE id = $1', [userId]),

            // Витягуємо замовлення з таблиці goods (використовуємо g.name та g.image_url)
            pool.query(
                `
                SELECT o.id, o.created_at as date, o.status, o.total_amount as total,
                       json_agg(json_build_object(
                           'name', g.name, 
                           'price', g.price, 
                           'sizes', g.sizes, 
                           'image', g.main_image_url,
                           'quantity', oi.quantity,
                            'size', oi.size
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
            phone: userResult.rows[0].phone,
            delivery_address: userResult.rows[0].delivery_address,
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
    const { username, email, phone, delivery_address } = req.body;

    try {
        // 3. Робимо магічний SQL запит
        const updatedUser = await pool.query(
            `UPDATE users 
             SET 
                username = COALESCE($1, username), 
                email = COALESCE($2, email),
                phone = COALESCE($3, phone),
                delivery_address = COALESCE($4, delivery_address),
                updated_at = NOW()
             WHERE id = $5 
             RETURNING id, username, email, phone, delivery_address`,
            [username, email, phone, delivery_address, userId],
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

export const verifyEmail = async (req: RequestWithUser, res: Response) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    try {
        const checkToken = await pool.query(
            'SELECT id FROM users WHERE verification_token = $1 AND token_expires_at > NOW()',
            [token],
        );

        if (checkToken.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        await pool.query(
            'UPDATE users SET email_verified = true, verification_token = null, token_expires_at = null WHERE id = $1',
            [checkToken.rows[0].id],
        );

        res.status(200).json({ message: 'Email verified successfully', success: true });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const userResult = await pool.query('SELECT email, id FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userEmail = userResult.rows[0].email;
        const userId = userResult.rows[0].id;
        const newToken = generateCode();
        const tokenExpiration = new Date(Date.now() + 12 * 60 * 60 * 1000);

        await pool.query('UPDATE users SET verification_token = $1, token_expires_at = $2 WHERE id = $3', [
            newToken,
            tokenExpiration,
            userId,
        ]);

        await sendVerificationEmail(userEmail, newToken);

        res.status(200).json({ message: 'Verification email resent successfully' });
    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '12h' });

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (!user || user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', token, user: user.rows[0] });
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await pool.query('SELECT id, username, email FROM users');
        res.status(200).json(users.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

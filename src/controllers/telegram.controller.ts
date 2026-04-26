import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { RequestWithUser } from '../types';
import pool from '../config/dataBase/postgreSQL';
import { supportMessage } from '../bot/SupportBot/services/notify.service';
import { io } from '../server';

export const generateLinkToTelegram = async (req: RequestWithUser, res: Response) => {
    const authToken = uuidv4();

    const user = req.user;

    const bot = req.params.bot; // 'support' або 'info'

    if (bot !== 'support' && bot !== 'info') {
        return res.status(400).json({ message: 'Invalid bot type. Must be "support" or "info".' });
    }

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const setTokenForUser = await pool.query(
            'UPDATE users SET telegram_auth_token = $1 WHERE id = $2 RETURNING *',
            [authToken, user.id],
        );

        if (setTokenForUser.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Telegram link generated successfully',
            link: `https://t.me/${bot === 'support' ? 'ShoesSupportSlickBot' : '@ShoesStoreSlickBot'}?start=${authToken}`,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error generating Telegram link' });
    }
};

export const sendSupportMessage = async (req: RequestWithUser, res: Response) => {
    const { chat_id, message } = req.body;

    const sender_id = req.user?.id;

    if (!sender_id || !chat_id || !message) {
        return res.status(400).json({ error: "sender_id, chat_id або message є обов'язковим параметром" });
    }

    try {
        // 1. Шукаємо чат і ОДРАЗУ підтягуємо telegram_id його власника через JOIN
        const chatQuery = await pool.query(
            `
            SELECT c.id, u.telegram_chat_id, c.user_id as chat_owner_id
            FROM chats c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1
        `,
            [chat_id],
        );

        if (chatQuery.rowCount === 0) {
            return res.status(404).json({ error: 'Чат не знайдено' });
        }

        // Дістаємо дані з результату запиту
        const { telegram_chat_id, chat_owner_id } = chatQuery.rows[0];

        // 2. Зберігаємо повідомлення в БД
        const addMessage = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, body) VALUES ($1, $2, $3) RETURNING *',
            [chat_id, sender_id, message],
        );

        console.log(`📩 Повідомлення додано до бази даних (chatId: ${chat_id}): ${message}`);

        // 3. Відправляємо в Telegram (ТІЛЬКИ ЯКЩО ПИШЕ АДМІН)
        // Якщо sender_id не співпадає з chat_owner_id, значить це відповів адмін
        if (String(sender_id) !== String(chat_owner_id)) {
            try {
                // Викликаємо вашого бота, передаючи правильний telegram_chat_id
                console.log(telegram_chat_id, message);

                await supportMessage(telegram_chat_id, `${message}`);
                console.log(`✅ Відправлено сповіщення в Telegram (ID: ${telegram_chat_id})`);
            } catch (tgError) {
                console.error('❌ Помилка при відправці в Telegram:', tgError);
                // Ми не перериваємо код (не робимо return res.status(500)),
                // бо в БД повідомлення вже успішно збереглося!
            }
        }

        io.to(chat_id).emit('new_message', addMessage.rows[0]);

        return res.status(200).json({ success: true, message: addMessage.rows[0] });
    } catch (error) {
        console.error('❌ Помилка при обробці повідомлення:', error);
        return res.status(500).json({ error: 'Помилка сервера' });
    }
};

export const getHistory = async (req: RequestWithUser, res: Response) => {
    const { chatId } = req.params;
    try {
        const history = await pool.query('SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC', [chatId]);
        return res.status(200).json(history.rows);
    } catch (error) {
        return res.status(500).json({ error: 'Помилка отримання історії' });
    }
};

export const getChats = async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const chatsResult = await pool.query(
            `
            SELECT c.id, c.type, c.created_at, u.username as customer_name, u.email as customer_email
            FROM chats c
            JOIN users u ON c.user_id = u.id
            WHERE c.type = 'support'
            ORDER BY c.created_at DESC
        `,
        );

        const chats = chatsResult.rows;

        if (chats.length === 0) {
            return res.status(200).json([]);
        }

        return res.status(200).json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
};

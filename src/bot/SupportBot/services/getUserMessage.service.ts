import TelegramBot from 'node-telegram-bot-api';
import pool from '../../../config/dataBase/postgreSQL'; // Імпорт пулу для роботи з PostgreSQL
import { io } from '../../../server'; // Імпорт об'єкта io для роботи з WebSockets

export const getUserMessage = (bot: TelegramBot) => {
    if (!bot) {
        console.error('❌ Бот не ініціалізований. Неможливо отримати повідомлення користувача.');
        return;
    }

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const userMessage = msg.text || '';

        const user = await pool.query('SELECT * FROM users WHERE telegram_chat_id = $1', [chatId]);
        const chat = await pool.query('SELECT * FROM chats WHERE user_id = $1', [user.rows[0]?.id || null]);

        const message = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, body) VALUES ($1, $2, $3) RETURNING *',
            [chat.rows[0].id, user.rows[0]?.id || null, userMessage],
        );

        const savedMessage = message.rows[0];

        // 2. ⚡️ МАГІЯ WEBSOCKETS ⚡️
        // Відправляємо збережене повідомлення ТІЛЬКИ в кімнату цього чату
        io.to(chat.rows[0].id).emit('new_message', savedMessage);

        console.log(`📩 Отримано повідомлення від користувача (chatId: ${chatId}): ${userMessage}`);
    });
};

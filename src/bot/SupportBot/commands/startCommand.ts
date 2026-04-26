import TelegramBot from 'node-telegram-bot-api';
import pool from '../../../config/dataBase/postgreSQL'; // Імпорт пулу для роботи з PostgreSQL

export function setupStartCommand(bot: TelegramBot) {
    if (!bot) {
        console.error('❌ Бот не ініціалізований. Неможливо налаштувати команду /start.');
        return;
    }

    bot.onText(/\/start (.+)/, async (msg, match) => {
        if (!match || match.length < 2) {
            return bot.sendMessage(msg.chat.id, '❌ Помилка: посилання застаріло або недійсне.');
        }
        const chatId = msg.chat.id;
        const token = match[1]; // Отримуємо токен з команди /start

        // 2. Робота з базою даних
        try {
            const userResult = await pool.query('SELECT id, username FROM users WHERE telegram_auth_token = $1', [
                token,
            ]);

            if (userResult.rowCount === 0) {
                return bot.sendMessage(chatId, '❌ Помилка: посилання застаріло або недійсне.');
            }

            const user = userResult.rows[0];

            // 2. БІНГО! Ми знаємо хто це. Зберігаємо його chatId і видаляємо одноразовий токен
            await pool.query('UPDATE users SET telegram_chat_id = $1, telegram_auth_token = NULL WHERE id = $2', [
                chatId,
                user.id,
            ]);

            bot.sendMessage(
                chatId,
                `✅ Hello, ${user.username}! Your account has been successfully connected. Write your message and our support team will get back to you as soon as possible.`,
            );

            await pool.query('INSERT INTO chats (type, user_id) VALUES ($1, $2)', ['support', user.id]);
        } catch (error) {
            console.error('❌ Помилка при роботі з базою даних postgreSQL:', error);
        }
    });
}

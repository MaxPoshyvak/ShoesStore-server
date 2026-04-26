import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { setupStartCommand } from './commands/startCommand';
import { setupTestCommand } from './commands/testCommand';
import { getUserMessage } from './services/getUserMessage.service';

dotenv.config();

const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;

let bot: TelegramBot | null = null;

if (token) {
    bot = new TelegramBot(token, { polling: true });
    console.log('🤖 Telegram Бот успішно запущений і готовий до роботи!');

    bot.on('polling_error', (error) => {
        console.error('❌ Помилка Telegram бота:', error.message);
    });

    // Тут ми будемо підключати наші команди (наприклад, /start)
    // import { setupStartCommand } from './commands/startCommand';
    setupStartCommand(bot);
    setupTestCommand(bot);
    getUserMessage(bot);
} else {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN не знайдено в .env. Бот не запущений.');
}

export default bot;

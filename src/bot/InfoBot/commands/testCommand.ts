import TelegramBot from 'node-telegram-bot-api';

export function setupTestCommand(bot: TelegramBot) {
    if (!bot) {
        console.error('❌ Бот не ініціалізований. Неможливо налаштувати команду /test.');
        return;
    }

    bot.onText(/\/test/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            await bot.sendMessage(
                chatId,
                '✅ Test command is working! Your bot is successfully connected to Telegram.',
            );
        } catch (error) {
            console.error('❌ Помилка при виконанні команди /test:', error);
        }
    });
}

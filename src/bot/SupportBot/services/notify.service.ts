import bot from '../index';

export const supportMessage = async (chatId: string, message: string) => {
    if (!bot) return;

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log(`✅ Telegram-сповіщення відправлено (chatId: ${chatId})`);
    } catch (error) {
        console.error(`❌ Помилка Telegram:`, error);
    }
};

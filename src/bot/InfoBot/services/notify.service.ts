import bot from '../index';

export const sendOrderStatusToTelegram = async (chatId: string, orderId: number, status: string) => {
    if (!bot) return;

    let statusIcon = '🔄';
    let statusTitle = 'Order Update';
    let customText = '';

    switch (status.toLowerCase()) {
        case 'paid':
        case 'success':
            statusIcon = '💸';
            statusTitle = 'Payment Successful!';
            customText = "Payment received. We're already heading to the warehouse to grab your pair.";
            break;
        case 'processing':
            statusIcon = '📦';
            statusTitle = 'Packing Your Order';
            customText = 'Your sneakers are boxed up and getting ready for dispatch!';
            break;
        case 'shipped':
            statusIcon = '🚚';
            statusTitle = 'Order is on the Way!';
            customText = "Your kicks are in transit. We'll send the tracking info shortly.";
            break;
        case 'completed':
        case 'delivered':
            statusIcon = '🔥';
            statusTitle = 'Order Delivered';
            customText = "We hope the fit is perfect. Can't wait to hear your feedback!";
            break;
        case 'cancelled':
            statusIcon = '❌';
            statusTitle = 'Order Cancelled';
            customText = 'Something went wrong. If this is a mistake, please reach out to our support.';
            break;
        default:
            statusIcon = '🔔';
            statusTitle = 'Order Update';
            customText = 'The status of your order has changed.';
    }

    const message = `
${statusIcon} <b>SLICK | ${statusTitle}</b>
━━━━━━━━━━━━━━━━━━
🆔 Order: <b>#${orderId}</b>
📌 Current Status: <b>${status.toUpperCase()}</b>

💬 <i>${customText}</i>
━━━━━━━━━━━━━━━━━━
🖤 Thank you for choosing the best. 
Your <b>Slick Store</b>.
    `;

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log(`✅ Telegram-сповіщення відправлено (chatId: ${chatId})`);
    } catch (error) {
        console.error(`❌ Помилка Telegram:`, error);
    }
};

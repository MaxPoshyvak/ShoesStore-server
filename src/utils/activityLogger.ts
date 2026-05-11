// utils/activityLogger.ts
import Activity from '../models/Activity';

// Сувора типізація, щоб ти не помилився при виклику
type ActivityCategory = 'Order' | 'Register' | 'OutOfStock' | 'Feedback';

interface LogParams {
    userId: string | number; // ID користувача (або 'system', якщо це система)
    category: ActivityCategory;
    actionData: string;
    actionAdditionalData?: string;
}

export const logActivity = async ({ userId, category, actionData, actionAdditionalData }: LogParams) => {
    try {
        let action = '';

        // Формуємо красиві повідомлення
        switch (category) {
            case 'Order':
                action = `Order #${actionData} was successfully ${actionAdditionalData || 'placed'}`;
                break;
            case 'Register':
                action = `New user registered — ${actionData}`;
                break;
            case 'OutOfStock':
                action = `${actionData} is out of stock`;
                break;
            case 'Feedback':
                action = `New feedback received — ${actionData} stars for ${actionAdditionalData}`;
                break;
            default:
                action = 'Unknown action';
        }

        // Записуємо в MongoDB
        await Activity.create({
            userId: String(userId),
            action,
            category,
        });
    } catch (error) {
        // Ми просто виводимо помилку в консоль, але НЕ кидаємо її далі (throw).
        // Це робиться для того, щоб якщо база логів впаде, основна дія (наприклад, оплата замовлення) не зламалася.
        console.error('Failed to log activity:', error);
    }
};

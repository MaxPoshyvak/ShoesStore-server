import rateLimit from 'express-rate-limit';

// Створюємо правило: максимум 3 запити на 15 хвилин з однієї IP-адреси
const resendEmailLimiter = rateLimit({
    windowMs: 1 * 58 * 1000, // 15 хвилин
    max: 1,
    message: { message: 'Too many requests, please try again later.' },
});

export default resendEmailLimiter;

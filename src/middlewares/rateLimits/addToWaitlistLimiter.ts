import rateLimit from 'express-rate-limit';

const addToWaitlistLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 4,
    message: { message: 'Too many requests, please try again later.' },
});

export default addToWaitlistLimiter;

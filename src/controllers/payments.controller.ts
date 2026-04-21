import { Request, Response } from 'express';
import pool from '../config/dataBase/postgreSQL';
// import { Stripe } from 'stripe/cjs/stripe.core';
import Stripe = require('stripe');

import type { RequestWithUser } from '../types';
import { sendOrderStatusToTelegram } from '../bot/services/notify.service';

const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
});

export const createPayment = async (req: RequestWithUser, res: Response) => {
    const { orderId } = req.params;

    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.id;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    try {
        const getOrderFromDB = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [
            orderId,
            userId,
        ]);

        const order = getOrderFromDB.rows[0];

        if (!order) {
            return res.status(404).json({ message: 'Order not found', userId });
        }

        const checkPaymentStatus = order.payment_status;

        if (checkPaymentStatus === 'paid') {
            return res.status(400).json({ message: 'Payment already completed for this order' });
        }

        const createNewPayment = await pool.query(
            'INSERT INTO payments (order_id, amount, status, provider) VALUES ($1, $2, $3, $4) RETURNING *',
            [orderId, order.total_amount, 'pending', 'stripe'],
        );

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            // Назви сторінок на твоєму фронтенді, куди Stripe поверне юзера після оплати
            success_url: `${clientUrl}/success?order_id=${orderId}`,
            cancel_url: `${clientUrl}/cancel?order_id=${orderId}`,

            // Вказуємо, за що платимо (це побачить клієнт на екрані оплати)
            line_items: [
                {
                    price_data: {
                        currency: 'uah', // Валюта
                        product_data: {
                            name: `Замовлення #${orderId} у ShoesStore`,
                        },
                        // Stripe вимагає суму в копійках!
                        unit_amount: Math.round(order.total_amount * 100),
                    },
                    quantity: 1, // Ми передаємо все замовлення як 1 пункт
                },
            ],
            // ТА САМА МАГІЯ: Ховаємо наш ID замовлення, щоб отримати його назад у Вебхуку
            metadata: {
                orderId: orderId.toString(),
            },
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating payment' });
    }
};

// payments.controller.ts

// Новий контролер для вебхука
export const webhookPayment = async (req: Request, res: Response) => {
    // 1. Отримуємо підпис від Stripe із заголовків
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log('--- STRIPE WEBHOOK DEBUG ---');
    console.log('1. Секрет знайдено?', !!webhookSecret);
    console.log('2. Секрет починається на:', webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'UNDEFINED');
    console.log('3. Чи є req.body Буфером (сирими даними)?', Buffer.isBuffer(req.body));
    console.log('4. Тип req.body:', typeof req.body);

    let event: any;

    try {
        // 2. Stripe сам перевіряє підпис і розшифровує подію.
        // Тут req.body — це сирий Buffer (завдяки express.raw)
        const payloadString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;

        event = stripe.webhooks.constructEvent(payloadString, sig as string, webhookSecret as string);
    } catch (err: any) {
        console.error(`❌ Помилка підпису вебхука: ${err.message}`);
        // Обов'язково повертаємо 400, якщо підпис не збігається
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 3. Обробляємо тільки ту подію, яка нам потрібна (успішна оплата)
    if (event.type === 'checkout.session.completed') {
        // Дістаємо об'єкт сесії
        const session = event.data.object as any;

        // Дістаємо наш orderId, який ми ховали в metadata при створенні!
        const orderId = session.metadata?.orderId;

        // Дістаємо ID транзакції банку (він нам потрібен для історії)
        const transactionId = session.payment_intent as string;

        if (orderId) {
            try {
                await pool.query(
                    `UPDATE payments 
                    SET transaction_id = $1, status = 'success', updated_at = NOW() 
                    WHERE id = (
                        SELECT id FROM payments 
                        WHERE order_id = $2 AND status = 'pending' 
                         ORDER BY created_at DESC 
                     LIMIT 1
                     )`,
                    [transactionId, orderId],
                );

                // 5. Оновлюємо таблицю orders (міняємо payment_status)
                await pool.query(
                    `UPDATE orders 
                     SET payment_status = 'paid', updated_at = NOW() 
                     WHERE id = $1`,
                    [orderId],
                );

                const userResult = await pool.query(
                    `SELECT u.telegram_chat_id 
     FROM users u 
     JOIN orders o ON u.id = o.user_id 
     WHERE o.id = $1`,
                    [orderId],
                );

                const chatId = userResult.rows[0]?.telegram_chat_id;

                if (chatId) {
                    await sendOrderStatusToTelegram(chatId, orderId, 'paid'); // Використовуй 'paid' з маленької, щоб спрацював твій switch/case
                    console.log(`✉️ Повідомлення успішно відправлено в Telegram!`);
                } else {
                    console.log(`ℹ️ У користувача для замовлення #${orderId} не підключений Telegram.`);
                }

                console.log(`✅ Замовлення #${orderId} успішно оплачено! Транзакція: ${transactionId}`);
            } catch (dbError) {
                console.error('Помилка оновлення бази даних при оплаті:', dbError);
                // Навіть якщо впала БД, ми не повинні повертати Stripe 500 помилку одразу,
                // але в реальному проєкті тут потрібна хороша система логування.
            }
        }
    }

    // 6. ОБОВ'ЯЗКОВО повертаємо Stripe відповідь 200 OK.
    // Якщо цього не зробити, Stripe буде думати, що твій сервер впав,
    // і буде спамити тебе цим запитом кожні кілька годин.
    res.status(200).json({ received: true });
};

export const getPayments = async (req: RequestWithUser, res: Response) => {
    try {
        const payments = await pool.query('SELECT * FROM payments');

        res.status(200).json(payments.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching payments' });
    }
};

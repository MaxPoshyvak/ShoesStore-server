import { Request, Response } from 'express';
import Activity from '../models/Activity';
import { RequestWithUser } from '../types';
import pool from '../config/dataBase/postgreSQL';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Ініціалізуємо клієнт за допомогою файлу з ключами, який ти скачав
if (!process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('GOOGLE_PRIVATE_KEY is not defined');
}

const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Відновлюємо перенесення рядків
    },
});

// Твій Property ID з Google Analytics (це цифри, не G-XXXX)
const propertyId = '537123339';

// Функція для отримання переглядів
async function getPageViews() {
    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                { startDate: '7daysAgo', endDate: 'today' }, // Поточний тиждень
                { startDate: '14daysAgo', endDate: '7daysAgo' }, // Минулий тиждень (для тренду)
            ],
            metrics: [{ name: 'screenPageViews' }], // Просимо віддати перегляди сторінок
        });

        // Google повертає масив, дістаємо цифри
        if (
            !response.rows ||
            response.rows.length < 2 ||
            !response.rows[0].metricValues ||
            !response.rows[1].metricValues
        ) {
            return { currentViews: 0, trend: 0 };
        }
        const currentViews = Number(response.rows[0].metricValues[0].value);
        const previousViews = Number(response.rows[1].metricValues[0].value);

        // Рахуємо відсоток як на дизайні (+8.1%)
        const trend = previousViews > 0 ? (((currentViews - previousViews) / previousViews) * 100).toFixed(1) : 100;

        return { currentViews, trend };
    } catch (error) {
        console.error('GA4 Error:', error);
        return { currentViews: 0, trend: 0 };
    }
}

export const getStatistic = async (req: Request, res: Response) => {
    try {
        const [
            revenueResult,
            activeOrdersResult,
            newCustomersResult,
            previousCustomersResult,
            weeklyOverviewResult, // 🔥 Додали результат для минулого періоду
            recentActivities,
        ] = await Promise.all([
            // 1. PostgreSQL: Дохід за останній місяць (успішні замовлення)
            pool.query(`
                SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
                FROM orders 
                WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '1 month'
            `),

            // 2. PostgreSQL: Кількість активних замовлень (pending)
            pool.query(`
                SELECT COUNT(*) AS count 
                FROM orders 
                WHERE status = 'pending'
            `),

            // 3. PostgreSQL: Нові користувачі за ОСТАННІ 2 тижні (поточний період)
            pool.query(`
                SELECT COUNT(*) AS count 
                FROM users 
                WHERE created_at >= NOW() - INTERVAL '2 weeks'
            `),

            // 4. 🔥 PostgreSQL: Користувачі за ПОПЕРЕДНІ 2 тижні (для порівняння)
            // Беремо тих, хто зареєструвався від 4 тижнів тому до 2 тижнів тому
            pool.query(`
                SELECT COUNT(*) AS count 
                FROM users 
                WHERE created_at >= NOW() - INTERVAL '4 weeks' 
                  AND created_at < NOW() - INTERVAL '2 weeks'
            `),
            pool.query(`
                WITH current_week AS (
                    SELECT generate_series(
                        date_trunc('week', CURRENT_DATE), -- Понеділок поточного тижня
                        date_trunc('week', CURRENT_DATE) + interval '6 days', -- Неділя
                        interval '1 day'
                    )::date AS date
                )
                SELECT 
                    to_char(cw.date, 'Dy') AS day, -- Повертає 'Mon', 'Tue' тощо
                    COUNT(o.id) AS count
                FROM current_week cw
                LEFT JOIN orders o ON date_trunc('day', o.created_at) = cw.date
                GROUP BY cw.date
                ORDER BY cw.date;
            `),

            // 5. MongoDB: Останні 5 активностей для блоку "Recent Activity"
            Activity.find().sort({ createdAt: -1 }).limit(5),
        ]);

        const currentCustomers = Number(newCustomersResult.rows[0].count);
        const previousCustomers = Number(previousCustomersResult.rows[0].count);

        // Вираховуємо різницю (наприклад: 18 поточних - 20 минулих = -2)
        const customersTrend = currentCustomers - previousCustomers;

        const weeklyOverview = weeklyOverviewResult.rows.map((row) => ({
            day: row.day,
            count: Number(row.count),
        }));
        const totalWeeklyOrders = weeklyOverview.reduce((sum, item) => sum + item.count, 0);

        const dashboardStats = {
            totalRevenue: Number(revenueResult.rows[0].total_revenue),
            activeOrders: Number(activeOrdersResult.rows[0].count),
            newCustomers: currentCustomers,
            previousCustomers: previousCustomers,
            customersTrend: customersTrend,
            weeklyOverview: weeklyOverview, // 🔥 Віддаємо масив по днях
            totalWeeklyOrders: totalWeeklyOrders, // 🔥 Віддаємо суму за тиждень
            recentActivity: recentActivities,
            pageViews: await getPageViews(),
        };

        res.status(200).json(dashboardStats);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getActivity = async (req: Request, res: Response) => {
    try {
        const activities = await Activity.find();
        res.status(200).json({ activities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

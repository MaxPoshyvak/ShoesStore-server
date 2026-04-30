import { Resend } from 'resend';
import pool from '../config/dataBase/postgreSQL';

// Ініціалізуємо клієнт Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendRestockEmail = async (emails: string[], goodId: number | string) => {
    if (!emails || emails.length === 0) return;

    try {
        const goodResult = await pool.query('SELECT name, price, main_image_url FROM goods WHERE id = $1', [goodId]);
        const good = goodResult.rows[0];

        if (!good) {
            console.error(`Товар з ID ${goodId} не знайдено при відправці листа`);
            return;
        }

        const productUrl = `${process.env.CLIENT_URL}/product/${goodId}`;

        const htmlContent = `
    <div style="background-color: #f4f4f5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <div style="background-color: #000000; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                    ShoesStore
                </h1>
            </div>

            <div style="padding: 40px 30px;">
                <h2 style="color: #111827; font-size: 26px; font-weight: 800; margin-top: 0; text-align: center; text-transform: uppercase;">
                    It's Back in Stock! 🔥
                </h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 35px;">
                    Great news! The item you've been waiting for has just landed back on our shelves. Grab your size before it sells out again.
                </p>
                
                <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 35px;">
                    <img src="${good.main_image_url}" alt="${good.name}" style="max-width: 220px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">
                    <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
                        ${good.name}
                    </h3>
                    <p style="color: #000000; font-size: 22px; font-weight: 800; margin: 0;">
                        ${good.price} UAH
                    </p>
                </div>

                <div style="text-align: center;">
                    <a href="${productUrl}" style="background-color: #000000; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                        Shop Now
                    </a>
                </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
                    You are receiving this email because you opted in for restock notifications at ShoesStore.
                </p>
            </div>

        </div>
    </div>
`;

        const { data, error } = await resend.emails.send({
            from: 'ShoesStore <info@slickstore.store>',

            to: 'info@slickstore.store',

            bcc: emails,

            subject: `🔥 ${good.name} знову в наявності!`,
            html: htmlContent,
        });

        if (error) {
            console.error('Помилка від API Resend:', error);
            return;
        }

        console.log(`✅ Сповіщення успішно відправлено! ID розсилки: ${data?.id}`);
    } catch (error) {
        console.error('Критична помилка при відправці листів:', error);
    }
};

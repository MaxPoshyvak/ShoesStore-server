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

export const sendVerificationEmail = async (email: string, token: string) => {
    try {
        const verificationUrl = `${process.env.CLIENT_URL}/verify?token=${token}`;

        const htmlContent = `
    <div style="background-color: #f3f4f6; padding: 50px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
            
            <!-- HEADER -->
            <div style="background-color: #000000; padding: 35px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase;">
                    ShoesStore
                </h1>
            </div>

            <!-- BODY -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #111827; font-size: 24px; font-weight: 800; margin-top: 0; text-align: center; text-transform: uppercase;">
                    You're almost there! ⚡
                </h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 35px;">
                    Thanks for signing up. To complete your account setup and start shopping the latest drops, please verify your email address.
                </p>

                <!-- CODE BLOCK (For copying) -->
                <div style="background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">
                        Your verification code
                    </p>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; color: #000000; letter-spacing: 8px;">
                        ${token}
                    </div>
                </div>

                <!-- DIVIDER -->
                <div style="text-align: center; margin-bottom: 30px; position: relative;">
                    <div style="position: absolute; top: 50%; left: 0; right: 0; border-top: 1px solid #e5e7eb; z-index: 1;"></div>
                    <span style="position: relative; background-color: #ffffff; padding: 0 15px; color: #9ca3af; font-size: 14px; font-weight: 600; text-transform: uppercase; z-index: 2;">
                        Or
                    </span>
                </div>

                <!-- BUTTON (For quick access) -->
                <div style="text-align: center;">
                    <a href="${verificationUrl}" style="background-color: #000000; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.3s;">
                        Verify Automatically
                    </a>
                </div>
            </div>
            
            <!-- FOOTER -->
            <div style="background-color: #f9fafb; padding: 30px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
                    If you didn't create an account at ShoesStore, you can safely ignore this email.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} ShoesStore. All rights reserved.
                </p>
            </div>

        </div>
    </div>
`;

        const { data, error } = await resend.emails.send({
            from: 'ShoesStore <info@slickstore.store>',

            to: 'info@slickstore.store',

            bcc: email,

            subject: 'Verify Your Email',
            html: htmlContent,
        });

        if (error) {
            console.error('Помилка від API Resend:', error);
            return;
        }

        console.log(`✅ Verification email sent successfully! Email ID: ${data?.id}`);
    } catch (error) {
        console.error('Critical error while sending verification email:', error);
    }
};

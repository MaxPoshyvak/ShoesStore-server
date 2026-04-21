const dotenv = require('dotenv');
dotenv.config();

const { chromium } = require('playwright');
// 1. Підключаємо твою базу даних. Перевір, чи правильний шлях до файлу!
const pool = require('../config/dataBase/postgreSQL.ts').default; // Важливо: якщо ти експортуєш пул як default, потрібно додати .default

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

(async () => {
    console.log('🚀 Запускаємо парсер...');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('Відкриваємо сайт Nike...');
        await page.goto('https://www.nike.com/w/big-kids-shoes-agibjzv4dhzy7ok', {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        console.log('Скролимо сторінку для завантаження фото...');
        await autoScroll(page);

        console.log('Збираємо товари...');
        const products = await page.$$eval('.product-card', (cards) => {
            return cards
                .map((card) => {
                    // ВИПРАВЛЕНО: Додано ||
                    const name = card.querySelector('.product-card__title')?.innerText || 'Unknown Shoe';
                    const priceText = card.querySelector('.product-price')?.innerText || '0';

                    // Витягуємо тільки цифри (якщо ціна 4 599 ₴ -> 4599)
                    const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;
                    const imageUrl = card.querySelector('img.product-card__hero-image')?.src || '';

                    return { name, price, imageUrl };
                })
                .filter((item) => item.imageUrl !== '' && item.price > 0)
                .slice(0, 20); // Візьмемо лише перші 20 товарів для тесту
        });

        // ВИПРАВЛЕНО: Додано зворотні лапки (шаблонні рядки)
        console.log(`✅ Зібрано товарів: ${products.length}`);
        console.log(products.slice(0, 3));

        // ==========================================
        // 4. ІНТЕГРАЦІЯ З ТВОЄЮ БАЗОЮ ДАНИХ (Slick)
        // ==========================================
        console.log('💾 Починаємо запис у базу даних...');

        let successCount = 0;

        for (const shoe of products) {
            try {
                // Додаємо дефолтні значення для полів, які парсер не збирає,
                // але які скоріш за все є обов'язковими (NOT NULL) у твоїй таблиці goods.
                const defaultDescription = 'Original Nike shoes';
                const defaultCategory = 'Sneakers';
                const defaultBrand = 'Nike';

                await pool.query(
                    `INSERT INTO goods (name, price, main_image_url, description, category, is_new, stock_quantity, sizes) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        shoe.name,
                        shoe.price * 40,
                        shoe.imageUrl,
                        defaultDescription,
                        'Child',
                        false,
                        20,
                        JSON.stringify(['36', '37', '38', '39']), // Приклад розмірів
                    ],
                );
                successCount++;
                console.log(`➕ Додано: ${shoe.name}`);
            } catch (dbError) {
                console.error(`❌ Помилка запису в БД для ${shoe.name}:`, dbError.message);
            }
        }

        console.log(`🎉 Готово! Успішно збережено ${successCount} товарів.`);
    } catch (error) {
        console.error('❌ Помилка під час парсингу:', error);
    } finally {
        console.log('Закриваємо браузер...');
        await browser.close();

        // Обов'язково закриваємо пул з'єднань, інакше скрипт "зависне" і не завершиться
        await pool.end();
    }
})();

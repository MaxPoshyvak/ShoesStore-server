import express from 'express';
import router from './routes';
import { webhookPayment } from './controllers/payments.controller';
import { mountSwagger } from './docs/swagger';
import cors from 'cors';

const app = express();
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookPayment);

app.use(express.json());
app.use(
    cors({
        origin: ['http://localhost:3000', 'https://shoes-store-khaki.vercel.app', 'https://www.slickstore.store'],
        credentials: true,
    }),
);
mountSwagger(app);
app.use('/api', router);

export default app;

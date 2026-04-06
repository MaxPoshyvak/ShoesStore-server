import express from 'express';
import router from './routes';
import { webhookPayment } from './controllers/payments.controller';

const app = express();
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookPayment);

app.use(express.json());
app.use('/api', router);

export default app;

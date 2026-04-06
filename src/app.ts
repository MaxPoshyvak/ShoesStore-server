import express from 'express';
import router from './routes';
import { webhookPayment } from './controllers/payments.controller';
import { mountSwagger } from './docs/swagger';

const app = express();
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookPayment);

app.use(express.json());
mountSwagger(app);
app.use('/api', router);

export default app;

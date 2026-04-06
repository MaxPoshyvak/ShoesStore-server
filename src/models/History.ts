import { Schema, model } from 'mongoose';

const historySchema = new Schema({
    userId: { type: String, required: true },
    goodId: { type: String, required: true },
    viewedAt: { type: Date, default: Date.now },
});

const History = model('History', historySchema);

export default History;

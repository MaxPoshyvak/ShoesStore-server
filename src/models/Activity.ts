import { Schema, model } from 'mongoose';

const activitySchema = new Schema({
    userId: { type: String, required: true },
    action: { type: String, required: true },
    category: { type: String, enum: ['Order', 'Register', 'OutOfStock', 'Feedback'], required: true },
    createdAt: { type: Date, default: Date.now },
});

const Activity = model('Activity', activitySchema);

export default Activity;

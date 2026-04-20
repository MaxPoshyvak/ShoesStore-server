import { Schema, model } from 'mongoose';

const feedbackSchema = new Schema({
    userId: { type: String, required: true },
    goodId: { type: String, required: true },
    goodName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    username: { type: String, required: true },
    userEmail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Feedback = model('Feedback', feedbackSchema);

export default Feedback;

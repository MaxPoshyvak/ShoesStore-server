import { Schema, model } from 'mongoose';

const favoritesSchema = new Schema({
    userId: { type: String, required: true },
    goodId: { type: Number, required: true },
    goodName: { type: String, required: true },
    goodPrice: { type: Number, required: true },
    goodImage: { type: String, required: true },
    oldPrice: { type: Number, required: false },
    category: { type: String, required: true },
    is_new: { type: Boolean, required: true },
    stock_quantity: { type: Number, required: true },
    sizes: { type: [String], required: true },
    favoritedAt: { type: Date, default: Date.now },
});

const Favorites = model('Favorites', favoritesSchema);

export default Favorites;

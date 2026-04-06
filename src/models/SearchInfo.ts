import { Schema, model } from 'mongoose';

const searchInfoSchema = new Schema({
    userId: { type: String, required: true },
    searchQuery: { type: String, required: true },
    writedAt: { type: Date, default: Date.now },
});

const SearchInfo = model('SearchInfo', searchInfoSchema);

export default SearchInfo;

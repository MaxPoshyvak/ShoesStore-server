import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class Database {
    private static instance: Database;
    private constructor() {}
    public static async getInstance() {
        if (!Database.instance) {
            try {
                await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mydb');
                console.log('✅ Connected to MongoDB');
                Database.instance = new Database();
            } catch (err) {
                console.error('❌ MongoDB connection error:', err);
                process.exit(1);
            }
        }
        return Database.instance;
    }
}

export default Database;

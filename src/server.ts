import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import Database from './config/dataBase/mongoDb';

const PORT = process.env.PORT || 3000;

(async () => {
    await Database.getInstance(); // Connect to MongoDB
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
})();

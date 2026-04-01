import app from './app';
import dotenv from 'dotenv';
import Database from './config/db';

dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
    // await Database.getInstance(); // Connect to MongoDB
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
})();

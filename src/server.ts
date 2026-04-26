import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import Database from './config/dataBase/mongoDb';
import './bot/SupportBot/index';
import { Server } from 'socket.io';
import http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000', // URL вашого фронтенду
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log(`🔌 Користувач підключився: ${socket.id}`);

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`👤 Користувач приєднався до кімнати чату: ${chatId}`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Користувач відключився: ${socket.id}`);
    });
});

(async () => {
    await Database.getInstance(); // Connect to MongoDB
    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
})();

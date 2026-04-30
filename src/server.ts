import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import app from './app';
import Database from './config/dataBase/mongoDb';
import './bot/SupportBot/index';
import { Server } from 'socket.io';
import http from 'http';

// Змушуємо Node.js використовувати IPv4 замість IPv6


const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

export const io = new Server(server, {
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    cors: {
        origin: ['http://localhost:3000', 'https://shoes-store-khaki.vercel.app'].filter(Boolean), // URL вашого фронтенду
        methods: ['GET', 'POST'],
        credentials: true,
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

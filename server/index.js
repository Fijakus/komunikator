const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors()); // In production, restrict this to specific domain

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
    }
});

// Pokoje
const rooms = {
    'public': { name: 'Ogólny (Publiczny)', type: 'public', messages: [] },
    'general': { name: 'Główny', type: 'public', messages: [] },
    'dev': { name: 'Developerski', type: 'public', messages: [] },
    'private1': { name: 'Tajny Pokój', type: 'private', messages: [] }
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Rate limiting for socket events (basic implementation)
    const messageRateLimit = { count: 0, lastMessage: 0 };

    socket.on('join_room', (roomName) => {
        // Basic validation
        if (typeof roomName !== 'string' || roomName.length > 30) return;

        socket.join(roomName);
        console.log(`User ${socket.id} joined room ${roomName}`);

        if (rooms[roomName]) {
            socket.emit('room_history', rooms[roomName].messages);
        }
    });

    socket.on('send_message', (data) => {
        // Throttling
        const now = Date.now();
        if (now - messageRateLimit.lastMessage < 500) { // Max 1 message per 500ms
            return;
        }
        messageRateLimit.lastMessage = now;

        // Validation
        if (!data || (!data.content && !data.file)) return;
        if (data.content && data.content.length > 5000) return; // Max message length

        const { room } = data;

        if (!room) return;

        // Create room if not exists (dynamic rooms)
        if (!rooms[room]) {
            rooms[room] = { name: room, type: 'public', messages: [] };
        }

        // Store message
        const storedMessage = {
            ...data,
            timestamp: new Date().toISOString(), // Trust server time, not client
            content: data.content ? data.content.slice(0, 5000) : '' // Truncate just in case
        };

        rooms[room].messages.push(storedMessage);
        if (rooms[room].messages.length > 50) rooms[room].messages.shift();

        io.to(room).emit('receive_message', storedMessage);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});

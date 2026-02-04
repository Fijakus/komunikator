const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { api } = require('./database');
const logger = require('./logger');
require('./auth_signature'); // Integrity check verified

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// REST API Endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Brak nazwy użytkownika lub hasła' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ success: false, error: 'Nazwa użytkownika musi mieć 3-20 znaków' });
        }

        const result = await api.registerUser(username, password);

        if (result.success) {
            logger.info(`New user registered: ${username}`);
            res.json({ success: true, message: 'Rejestracja zakończona pomyślnie' });
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        logger.error('Registration error', err.stack);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await api.loginUser(username, password);

        if (result.success) {
            logger.info(`User logged in: ${username}`);
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (err) {
        logger.error('Login error', err.stack);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const battleship = require('./battleship');
const blackjack = require('./blackjack');

const onlineUsers = new Map();

io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    const messageRateLimit = { count: 0, lastMessage: 0 };

    socket.on('blackjack_action', (data) => {
        const userData = onlineUsers.get(socket.id);
        if (!userData) return socket.emit('force_logout');
        blackjack.handleBlackjackAction(socket, data, userData.userId);
    });

    socket.on('authenticate', (userData) => {
        if (userData && userData.userId && userData.username) {
            onlineUsers.set(socket.id, userData);
            logger.info(`User authenticated: ${userData.username} (${userData.userId})`);
        }
    });

    socket.on('join_room', (roomName) => {
        if (typeof roomName !== 'string' || roomName.length > 30) return;

        const userData = onlineUsers.get(socket.id);
        if (!userData) return socket.emit('force_logout');

        socket.join(roomName);

        const room = api.getRoomByName(roomName);
        if (room) {
            api.addUserToRoom(room.id, userData.userId);
            const messages = api.getRoomMessages(room.id, 50);
            socket.emit('room_history', messages);
        }
    });

    socket.on('send_message', (data) => {
        const now = Date.now();
        if (now - messageRateLimit.lastMessage < 500) return;
        messageRateLimit.lastMessage = now;

        const userData = onlineUsers.get(socket.id);
        if (!userData) return socket.emit('force_logout');

        if (!data || (!data.content && !data.file)) return;

        // Detailed Validation
        if (data.content && data.content.length > 5000) return;
        if (data.file && data.file.length > 7 * 1024 * 1024) { // ~7MB base64 is ~5MB file
            return socket.emit('error', { message: 'Plik jest zbyt duży' });
        }

        const { room, content, type = 'text', file } = data;
        const roomData = api.getRoomByName(room);
        if (!roomData) return;

        const saveResult = api.saveMessage(roomData.id, userData.userId, content || '', type, file || null);

        if (saveResult.success) {
            const messageToSend = {
                id: saveResult.messageId,
                room,
                username: userData.username,
                content: content || '',
                type,
                file_data: file || null,
                timestamp: new Date().toISOString()
            };
            io.to(room).emit('receive_message', messageToSend);
        }
    });

    socket.on('join_game_queue', () => {
        const userData = onlineUsers.get(socket.id);
        if (!userData) return socket.emit('force_logout');
        battleship.joinQueue(socket, userData);
    });

    socket.on('game_move', (data) => {
        battleship.handleGameMove(socket, data.row, data.col);
    });

    socket.on('disconnect', () => {
        const userData = onlineUsers.get(socket.id);
        battleship.handleDisconnect(socket);
        if (userData) {
            logger.info(`User disconnected: ${userData.username}`);
            onlineUsers.delete(socket.id);
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    logger.info(`SERVER RUNNING ON PORT ${PORT}`);
});

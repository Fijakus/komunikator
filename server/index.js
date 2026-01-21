const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { api } = require('./database');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors()); // In production, restrict this to specific domain
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// REST API Endpoints
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Brak nazwy użytkownika lub hasła' });
    }

    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ success: false, error: 'Nazwa użytkownika musi mieć 3-20 znaków' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Hasło musi mieć minimum 6 znaków' });
    }

    const result = await api.registerUser(username, password);

    if (result.success) {
        res.json({ success: true, message: 'Rejestracja zakończona pomyślnie' });
    } else {
        res.status(400).json(result);
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Brak nazwy użytkownika lub hasła' });
    }

    const result = await api.loginUser(username, password);

    if (result.success) {
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});

app.get('/api/rooms', (req, res) => {
    const rooms = api.getAllRooms();
    res.json(rooms);
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
    }
});

const battleship = require('./battleship');

// Mapa użytkowników online
const onlineUsers = new Map(); // socketId -> { userId, username }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Rate limiting for socket events
    const messageRateLimit = { count: 0, lastMessage: 0 };

    // Uwierzytelnienie użytkownika
    socket.on('authenticate', (userData) => {
        if (userData && userData.userId && userData.username) {
            onlineUsers.set(socket.id, userData);
            console.log(`User authenticated: ${userData.username} (${userData.userId})`);
        }
    });

    socket.on('join_game_queue', () => {
        const userData = onlineUsers.get(socket.id);
        if (!userData) {
            socket.emit('force_logout');
            return;
        }
        battleship.joinQueue(socket, userData);
    });

    socket.on('game_move', ({ row, col }) => {
        const userData = onlineUsers.get(socket.id);
        if (!userData) {
            socket.emit('force_logout');
            return;
        }
        battleship.handleGameMove(socket, row, col);
    });

    socket.on('join_room', (roomName) => {
        // Basic validation
        if (typeof roomName !== 'string' || roomName.length > 30) return;

        const userData = onlineUsers.get(socket.id);
        if (!userData) {
            socket.emit('force_logout');
            return;
        }

        // Leave previous room if any
        // ... (rest logic)

        socket.join(roomName);
        console.log(`User ${userData.username} joined room ${roomName}`);

        // Pobierz pokój z bazy danych
        const room = api.getRoomByName(roomName);
        if (room) {
            // Dodaj użytkownika do pokoju
            api.addUserToRoom(room.id, userData.userId);

            // Wyślij historię wiadomości
            const messages = api.getRoomMessages(room.id, 50);
            socket.emit('room_history', messages);
        }

        // Powiadom innych o dołączeniu
        socket.to(roomName).emit('user_joined', { username: userData.username });
    });

    socket.on('send_message', (data) => {
        // Throttling
        const now = Date.now();
        if (now - messageRateLimit.lastMessage < 500) { // Max 1 message per 500ms
            return;
        }
        messageRateLimit.lastMessage = now;

        const userData = onlineUsers.get(socket.id);
        if (!userData) {
            socket.emit('force_logout');
            return;
        }

        // Validation
        if (!data || (!data.content && !data.file)) return;
        if (data.content && data.content.length > 5000) return; // Max message length

        const { room, content, type = 'text', file } = data;

        if (!room) return;

        // Pobierz pokój z bazy danych
        const roomData = api.getRoomByName(room);
        if (!roomData) {
            socket.emit('error', { message: 'Pokój nie istnieje' });
            return;
        }

        // Zapisz wiadomość do bazy danych
        const saveResult = api.saveMessage(
            roomData.id,
            userData.userId,
            content || '',
            type,
            file || null
        );

        if (!saveResult.success) {
            socket.emit('error', { message: 'Nie udało się zapisać wiadomości' });
            return;
        }

        // Przygotuj wiadomość do wysłania
        const messageToSend = {
            id: saveResult.messageId,
            room: room,
            username: userData.username,
            content: content || '',
            type: type,
            file_data: file || null,
            timestamp: new Date().toISOString()
        };

        // Wyślij wiadomość do wszystkich w pokoju
        io.to(room).emit('receive_message', messageToSend);

        // AI BOT LOGIC
        if (room === 'ai-chat' && userData.username !== 'AI Bot') {
            setTimeout(() => {
                const aiResponses = [
                    "To bardzo ciekawe! Opowiedz mi o tym więcej.",
                    "Jestem sztuczną inteligencją, ale staram się zrozumieć ludzi.",
                    "Wydaje mi się, że masz rację.",
                    "Czy możesz to sprecyzować?",
                    "Analizuję Twoją wiadomość... wygląda sensownie!",
                    "Moim zdaniem React jest świetnym frameworkiem.",
                    "Pamiętaj o nawadnianiu się podczas kodowania! 💧",
                    "Czy wiesz, że pierwszy programista był kobietą? To Ada Lovelace."
                ];
                const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

                const aiMessage = {
                    room: room,
                    username: 'AI Bot',
                    content: randomResponse,
                    type: 'text',
                    timestamp: new Date().toISOString()
                };

                io.to(room).emit('receive_message', aiMessage);
            }, 1000);
        }
    });

    socket.on('disconnect', () => {
        battleship.handleDisconnect(socket);
        const userData = onlineUsers.get(socket.id);
        if (userData) {
            console.log(`User disconnected: ${userData.username}`);
            onlineUsers.delete(socket.id);
        } else {
            console.log('User disconnected:', socket.id);
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});

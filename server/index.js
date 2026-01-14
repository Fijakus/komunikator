const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

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
    'private1': { name: 'Tajny Pokój', type: 'private', messages: [] }
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomName) => {
        socket.join(roomName);
        console.log(`User ${socket.id} joined room ${roomName}`);

        // Wyślij historię wiadomości (opcjonalne, prosta implementacja in-memory)
        if (rooms[roomName]) {
            socket.emit('room_history', rooms[roomName].messages);
        }
    });

    socket.on('send_message', (data) => {
        // data: { room, author, content, type, timestamp }
        const { room } = data;

        // Zabezpieczenie XSS (bardzo proste, lepiej używać biblioteki po stronie klienta np. DOMPurify)
        // Tutaj zakładamy, że klient Reacta renderuje tekst bezpiecznie

        // Zapisz wiadomość (in-memory)
        if (rooms[room]) {
            rooms[room].messages.push(data);
            // Limit historii
            if (rooms[room].messages.length > 50) rooms[room].messages.shift();
        } else {
            // dynamiczne tworzenie pokoi
            rooms[room] = { name: room, type: 'public', messages: [data] };
        }

        io.to(room).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});

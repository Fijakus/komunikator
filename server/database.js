const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Inicjalizacja bazy danych
const db = new Database(path.join(__dirname, 'komunikator.db'));

// Tworzenie tabel
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL DEFAULT 'public',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT,
        type TEXT DEFAULT 'text',
        file_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS room_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS game_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner_id INTEGER,
        loser_id INTEGER,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (winner_id) REFERENCES users(id),
        FOREIGN KEY (loser_id) REFERENCES users(id)
    );
`);

// Dodanie domyślnych pokoi
const insertRoom = db.prepare('INSERT OR IGNORE INTO rooms (name, type) VALUES (?, ?)');
insertRoom.run('public', 'public');
insertRoom.run('general', 'public');
insertRoom.run('dev', 'public');
insertRoom.run('ai-chat', 'public');
insertRoom.run('statki', 'public'); // New game room
insertRoom.run('blackjack', 'public'); // New game room
insertRoom.run('private1', 'private');

// Funkcje użytkowników
const userQueries = {
    register: db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)'),
    findByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
    findById: db.prepare('SELECT id, username, created_at FROM users WHERE id = ?')
};

// Funkcje pokoi
const roomQueries = {
    getAll: db.prepare('SELECT * FROM rooms'),
    getById: db.prepare('SELECT * FROM rooms WHERE id = ?'),
    getByName: db.prepare('SELECT * FROM rooms WHERE name = ?'),
    create: db.prepare('INSERT INTO rooms (name, type) VALUES (?, ?)'),
    addMember: db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)'),
    getMembers: db.prepare(`
        SELECT u.id, u.username 
        FROM users u 
        JOIN room_members rm ON u.id = rm.user_id 
        WHERE rm.room_id = ?
    `)
};

// Funkcje wiadomości
const messageQueries = {
    insert: db.prepare('INSERT INTO messages (room_id, user_id, content, type, file_data) VALUES (?, ?, ?, ?, ?)'),
    getByRoom: db.prepare(`
        SELECT m.*, u.username 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        WHERE m.room_id = ? 
        ORDER BY m.timestamp DESC 
        LIMIT ?
    `),
    getRecent: db.prepare(`
        SELECT m.*, u.username, r.name as room_name
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        JOIN rooms r ON m.room_id = r.id
        ORDER BY m.timestamp DESC 
        LIMIT ?
    `)
};

// API funkcje
const api = {
    // Rejestracja użytkownika
    registerUser: async (username, password) => {
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            const result = userQueries.register.run(username, passwordHash);
            return { success: true, userId: result.lastInsertRowid };
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                return { success: false, error: 'Użytkownik już istnieje' };
            }
            return { success: false, error: error.message };
        }
    },

    // Logowanie użytkownika
    loginUser: async (username, password) => {
        try {
            const user = userQueries.findByUsername.get(username);
            if (!user) {
                return { success: false, error: 'Nieprawidłowa nazwa użytkownika lub hasło' };
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return { success: false, error: 'Nieprawidłowa nazwa użytkownika lub hasło' };
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    created_at: user.created_at
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Pobierz użytkownika po ID
    getUserById: (userId) => {
        return userQueries.findById.get(userId);
    },

    // Pobierz wszystkie pokoje
    getAllRooms: () => {
        return roomQueries.getAll.all();
    },

    // Pobierz pokój po nazwie
    getRoomByName: (name) => {
        return roomQueries.getByName.get(name);
    },

    // Dodaj użytkownika do pokoju
    addUserToRoom: (roomId, userId) => {
        try {
            roomQueries.addMember.run(roomId, userId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Zapisz wiadomość
    saveMessage: (roomId, userId, content, type = 'text', fileData = null) => {
        try {
            const result = messageQueries.insert.run(roomId, userId, content, type, fileData);
            return { success: true, messageId: result.lastInsertRowid };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Pobierz historię wiadomości pokoju
    getRoomMessages: (roomId, limit = 50) => {
        return messageQueries.getByRoom.all(roomId, limit).reverse();
    },

    // Pobierz ostatnie wiadomości
    getRecentMessages: (limit = 100) => {
        return messageQueries.getRecent.all(limit);
    },

    // Zapisz wynik gry
    saveGameResult: (winnerId, loserId) => {
        try {
            const stmt = db.prepare('INSERT INTO game_results (winner_id, loser_id) VALUES (?, ?)');
            stmt.run(winnerId, loserId);
            return { success: true };
        } catch (error) {
            console.error('Błąd zapisu gry:', error);
            return { success: false, error: error.message };
        }
    },

    // Pobierz saldo użytkownika
    getBalance: (userId) => {
        try {
            const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
            return row ? row.balance : 0;
        } catch (error) {
            console.error('Błąd pobierania salda:', error);
            return 0;
        }
    },

    // Aktualizuj saldo użytkownika
    updateBalance: (userId, amount) => {
        try {
            db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);
            return { success: true };
        } catch (error) {
            console.error('Błąd aktualizacji salda:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports = { db, api };

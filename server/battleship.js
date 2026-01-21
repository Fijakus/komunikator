const { api } = require('./database');

class BattleshipGame {
    constructor(player1, player2) {
        this.players = [player1, player2]; // [socket, socket]
        this.boards = {
            [player1.id]: this.generateBoard(),
            [player2.id]: this.generateBoard()
        };
        this.shots = {
            [player1.id]: [], // strzały oddane przez gracza 1 (na planszę gracza 2)
            [player2.id]: []
        };
        this.turn = player1.id; // Zaczyna gracz 1
        this.status = 'playing'; // playing, finished
        this.winner = null;

        // Powiadom graczy o starcie
        this.players.forEach(p => {
            const opponent = this.players.find(op => op.id !== p.id);
            p.emit('game_start', {
                opponentName: opponent.userData ? opponent.userData.username : 'Przeciwnik',
                turn: this.turn
            });
            // Wyślij graczowi jego planszę
            p.emit('my_board', this.boards[p.id]);
        });
    }

    generateBoard() {
        // Pusta plansza 10x10
        const board = Array(10).fill(null).map(() => Array(10).fill(0));
        const ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]; // Rozmiary statków

        ships.forEach(size => {
            let placed = false;
            while (!placed) {
                const horizontal = Math.random() < 0.5;
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);

                if (this.canPlaceShip(board, row, col, size, horizontal)) {
                    this.placeShip(board, row, col, size, horizontal);
                    placed = true;
                }
            }
        });
        return board;
    }

    canPlaceShip(board, row, col, size, horizontal) {
        if (horizontal) {
            if (col + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board[row][col + i] !== 0) return false; // Zajęte
                // Sprawdź odstępy (uproszczone: tylko czy nie nachodzi)
                // W pełnej wersji statki nie mogą się stykać, tu dla uproszczenia tylko kolizja
            }
        } else {
            if (row + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board[row + i][col] !== 0) return false;
            }
        }
        return true;
    }

    placeShip(board, row, col, size, horizontal) {
        if (horizontal) {
            for (let i = 0; i < size; i++) board[row][col + i] = 1; // 1 = statek
        } else {
            for (let i = 0; i < size; i++) board[row + i][col] = 1;
        }
    }

    handleMove(socketId, row, col) {
        if (this.status !== 'playing') return;
        if (socketId !== this.turn) return;

        const opponent = this.players.find(p => p.id !== socketId);
        const opponentBoard = this.boards[opponent.id];

        // Sprawdź czy już tu strzelano
        // W realnej implementacji trzymalibyśmy historię strzałów na planszy

        const isHit = opponentBoard[row][col] === 1;
        const result = isHit ? 'HIT' : 'MISS';

        // Aktualizuj stan (dla uproszczenia nie zapisujemy na planszy "trafiony", tylko wysyłamy zdarzenie)
        // W pełnej wersji: oznacz na planszy
        if (isHit) {
            opponentBoard[row][col] = 2; // 2 = trafiony
        } else {
            // opponentBoard[row][col] = 3; // 3 = pudło (opcjonalnie)
        }

        // Wyślij wynik strzału do obu graczy
        this.players.forEach(p => {
            p.emit('shot_result', {
                shooter: socketId,
                row,
                col,
                result
            });
        });

        if (isHit) {
            // Jeśli trafiony, sprawdź czy wygrana
            if (this.checkWin(opponent.id)) {
                this.finishGame(socketId, opponent.id);
            }
            // Jeśli trafiony, tura ZOSTAJE u strzelca
        } else {
            // Jeśli pudło, zmiana tury
            this.turn = opponent.id;
            this.players.forEach(p => p.emit('turn_change', this.turn));
        }
    }

    checkWin(loserSocketId) {
        // Sprawdź czy na planszy przegranego zostały jakieś statki (1)
        const board = this.boards[loserSocketId];
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                if (board[r][c] === 1) return false;
            }
        }
        return true;
    }

    finishGame(winnerSocketId, loserSocketId) {
        this.status = 'finished';
        this.winner = winnerSocketId;

        const winner = this.players.find(p => p.id === winnerSocketId);
        const loser = this.players.find(p => p.id === loserSocketId);

        this.players.forEach(p => p.emit('game_over', { winner: winnerSocketId }));

        // Zapisz do bazy
        if (winner.userData && loser.userData) {
            api.saveGameResult(winner.userData.userId, loser.userData.userId);
            console.log(`Gra zakończona. Wygrał: ${winner.userData.username}, Przegrał: ${loser.userData.username}`);
        }
    }

    handleDisconnect(socketId) {
        // Jeśli gra trwa, drugi wygrywa walkowerem
        if (this.status === 'playing') {
            const winner = this.players.find(p => p.id !== socketId);
            if (winner) {
                this.status = 'aborted';
                winner.emit('game_over', { winner: winner.id, reason: 'opponent_disconnected' });
            }
        }
    }
}

// Prosty menadżer kolejki
const queue = [];
const games = new Map(); // socketId -> GameInstance

function joinQueue(socket, userData) {
    socket.userData = userData; // Przypisz dane usera do socketu dla wygody

    // Sprawdź czy gracz już nie gra
    if (games.has(socket.id)) return;

    // Sprawdź czy już jest w kolejce
    if (queue.find(s => s.id === socket.id)) return;

    queue.push(socket);
    socket.emit('queue_status', 'waiting');

    console.log(`Gracz ${userData.username} dołączył do kolejki gry. W kolejce: ${queue.length}`);

    if (queue.length >= 2) {
        const p1 = queue.shift();
        const p2 = queue.shift();
        startGame(p1, p2);
    }
}

function startGame(p1, p2) {
    const game = new BattleshipGame(p1, p2);
    games.set(p1.id, game);
    games.set(p2.id, game);
    console.log(`Rozpoczęto grę: ${p1.id} vs ${p2.id}`);
}

function handleGameMove(socket, row, col) {
    const game = games.get(socket.id);
    if (game) {
        game.handleMove(socket.id, row, col);
    }
}

function handleDisconnect(socket) {
    // Usuń z kolejki
    const qIndex = queue.findIndex(s => s.id === socket.id);
    if (qIndex !== -1) queue.splice(qIndex, 1);

    // Obsłuż rozłączenie gry
    const game = games.get(socket.id);
    if (game) {
        game.handleDisconnect(socket.id);
        // Clean up
        game.players.forEach(p => games.delete(p.id));
    }
}

module.exports = { joinQueue, handleGameMove, handleDisconnect };

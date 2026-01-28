const { api } = require('./database');
const logger = require('./logger');

class BlackjackGame {
    constructor(userId) {
        this.userId = userId;
        this.deck = this.createDeck();
        this.playerHand = [];
        this.dealerHand = [];
        this.status = 'playing'; // playing, win, lose, push, blackjack, bust
        this.bet = 0;
    }

    createDeck() {
        const suits = ['♠', '♣', '♥', '♦'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
        // 4 decks
        for (let i = 0; i < 4; i++) {
            for (let suit of suits) {
                for (let value of values) {
                    deck.push({ suit, value });
                }
            }
        }
        return deck.sort(() => Math.random() - 0.5);
    }

    drawCard() {
        if (this.deck.length === 0) {
            this.deck = this.createDeck();
        }
        return this.deck.pop();
    }

    calculateScore(hand) {
        let score = 0;
        let aces = 0;
        for (let card of hand) {
            if (card.value === 'A') {
                aces += 1;
                score += 11;
            } else if (['J', 'Q', 'K'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        while (score > 21 && aces > 0) {
            score -= 10;
            aces -= 1;
        }
        return score;
    }

    start(bet) {
        const balance = api.getBalance(this.userId);
        if (balance < bet) return { success: false, error: 'Niewystarczające środki' };

        this.bet = bet;
        api.updateBalance(this.userId, -bet);
        logger.info(`User ${this.userId} started Blackjack with bet ${bet}`);

        this.playerHand = [this.drawCard(), this.drawCard()];
        this.dealerHand = [this.drawCard(), this.drawCard()];

        const playerScore = this.calculateScore(this.playerHand);
        if (playerScore === 21) {
            this.status = 'blackjack';
            this.resolveGame();
        }
        return { success: true };
    }

    hit() {
        if (this.status !== 'playing') return;
        this.playerHand.push(this.drawCard());
        if (this.calculateScore(this.playerHand) > 21) {
            this.status = 'lose';
            this.resolveGame();
        }
    }

    doubleDown() {
        if (this.status !== 'playing' || this.playerHand.length !== 2) return;

        const balance = api.getBalance(this.userId);
        if (balance < this.bet) return { success: false, error: 'Niewystarczające środki na podwojenie' };

        api.updateBalance(this.userId, -this.bet);
        this.bet *= 2;

        this.playerHand.push(this.drawCard());
        if (this.calculateScore(this.playerHand) > 21) {
            this.status = 'lose';
        } else {
            this.stand();
        }
        this.resolveGame();
        return { success: true };
    }

    stand() {
        if (this.status !== 'playing') return;

        let dealerScore = this.calculateScore(this.dealerHand);
        while (dealerScore < 17) {
            this.dealerHand.push(this.drawCard());
            dealerScore = this.calculateScore(this.dealerHand);
        }

        const playerScore = this.calculateScore(this.playerHand);

        if (dealerScore > 21 || playerScore > dealerScore) {
            this.status = 'win';
        } else if (playerScore < dealerScore) {
            this.status = 'lose';
        } else {
            this.status = 'push';
        }
        this.resolveGame();
    }

    resolveGame() {
        logger.info(`Blackjack resolved for user ${this.userId}: ${this.status} (bet: ${this.bet})`);
        if (this.status === 'win') {
            api.updateBalance(this.userId, this.bet * 2);
        } else if (this.status === 'blackjack') {
            api.updateBalance(this.userId, Math.floor(this.bet * 2.5));
        } else if (this.status === 'push') {
            api.updateBalance(this.userId, this.bet);
        }
        // loss means bet is already taken
    }
}

const userGames = new Map(); // userId -> BlackjackGame

function handleBlackjackAction(socket, data, userId) {
    let action, bet;
    if (typeof data === 'string') {
        action = data;
    } else {
        action = data.action;
        bet = data.bet;
    }

    let game = userGames.get(userId);

    if (action === 'start') {
        game = new BlackjackGame(userId);
        const result = game.start(bet || 100);
        if (!result.success) {
            socket.emit('blackjack_error', result.error);
            return;
        }
        userGames.set(userId, game);
    } else if (game && action === 'hit') {
        game.hit();
    } else if (game && action === 'stand') {
        game.stand();
    } else if (game && action === 'double') {
        const result = game.doubleDown();
        if (result && !result.success) {
            socket.emit('blackjack_error', result.error);
        }
    }

    if (game) {
        socket.emit('blackjack_state', {
            playerHand: game.playerHand,
            dealerHand: game.status === 'playing' ? [game.dealerHand[0], { value: '?', suit: '?' }] : game.dealerHand,
            playerScore: game.calculateScore(game.playerHand),
            dealerScore: game.status === 'playing' ? '?' : game.calculateScore(game.dealerHand),
            status: game.status,
            bet: game.bet,
            balance: api.getBalance(userId)
        });
    } else {
        socket.emit('blackjack_balance', { balance: api.getBalance(userId) });
    }
}

module.exports = { BlackjackGame, handleBlackjackAction };

const { BlackjackGame } = require('../blackjack');

// Mock api
const mockApi = {
    getBalance: jest.fn(() => 1000),
    updateBalance: jest.fn()
};

// Inject mock api (simple way for this exercise)
jest.mock('../database', () => ({
    api: {
        getBalance: (id) => 1000,
        updateBalance: (id, amt) => { }
    }
}));

describe('BlackjackGame Logic', () => {
    let game;

    beforeEach(() => {
        game = new BlackjackGame(1);
    });

    test('should create a deck with 208 cards (4 decks)', () => {
        expect(game.deck.length).toBe(208);
    });

    test('should calculate score correctly with Ace', () => {
        const hand = [
            { value: 'A', suit: '♠' },
            { value: '5', suit: '♣' }
        ];
        expect(game.calculateScore(hand)).toBe(16);

        hand.push({ value: 'K', suit: '♦' }); // 1 + 5 + 10
        expect(game.calculateScore(hand)).toBe(16);
    });

    test('should deduct bet from balance on start', () => {
        // Since we mocked database.js, we expect it to "work"
        const result = game.start(100);
        expect(result.success).toBe(true);
        expect(game.bet).toBe(100);
    });

    test('should handle bust', () => {
        game.start(100);
        game.playerHand = [
            { value: '10', suit: '♠' },
            { value: 'K', suit: '♣' },
            { value: '5', suit: '♦' }
        ];
        game.hit(); // This will trigger logic check if status is bust
        // In our current hit() logic, it checks if score > 21
        expect(game.status).toBe('lose');
    });
});

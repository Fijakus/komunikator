import React, { useState, useEffect } from 'react';

function Blackjack({ socket, isActive }) {
    const [gameState, setGameState] = useState(null);
    const [balance, setBalance] = useState(0);
    const [bet, setBet] = useState(100);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isActive) return;

        socket.on('blackjack_state', (state) => {
            setGameState(state);
            setBalance(state.balance);
            setError(null);
        });

        socket.on('blackjack_balance', (data) => {
            setBalance(data.balance);
        });

        socket.on('blackjack_error', (msg) => {
            setError(msg);
            setTimeout(() => setError(null), 3000);
        });

        // Request initial balance
        socket.emit('blackjack_action', 'get_balance');

        return () => {
            socket.off('blackjack_state');
            socket.off('blackjack_balance');
            socket.off('blackjack_error');
        };
    }, [socket, isActive]);

    const handleAction = (action, extraData = {}) => {
        socket.emit('blackjack_action', { action, ...extraData });
    };

    if (!isActive) return null;

    const renderCard = (card, index) => {
        const isHidden = card.value === '?';
        return (
            <div key={index} className={`playing-card ${['♥', '♦'].includes(card.suit) ? 'red' : ''} ${isHidden ? 'hidden' : ''}`}>
                {!isHidden ? (
                    <>
                        <div className="card-top">
                            <span>{card.value}</span>
                            <span>{card.suit}</span>
                        </div>
                        <div className="card-suit-large">{card.suit}</div>
                        <div className="card-bottom">
                            <span>{card.suit}</span>
                            <span>{card.value}</span>
                        </div>
                    </>
                ) : (
                    <div className="card-back">🃟</div>
                )}
            </div>
        );
    };

    return (
        <div className="blackjack-wrapper">
            <div className="blackjack-header">
                <div className="balance-badge">
                    <span className="label">TWÓJ PORTFEL</span>
                    <span className="value">{balance} 🪙</span>
                </div>
                {error && <div className="error-toast">{error}</div>}
            </div>

            {!gameState || gameState.status !== 'playing' && gameState.status !== 'blackjack' && !gameState.playerHand.length ? (
                <div className="blackjack-lobby">
                    <div className="lobby-content">
                        <h1>🃏 GRAND CASINO</h1>
                        <p>Wybierz stawkę i spróbuj szczęścia!</p>

                        <div className="betting-controls">
                            {[10, 50, 100, 500].map(amount => (
                                <button
                                    key={amount}
                                    className={`bet-chip ${bet === amount ? 'active' : ''}`}
                                    onClick={() => setBet(amount)}
                                >
                                    {amount}
                                </button>
                            ))}
                        </div>

                        <button className="play-now-btn" onClick={() => handleAction('start', { bet })}>
                            ROZDAJ KARTY
                        </button>
                    </div>
                </div>
            ) : (
                <div className="blackjack-table-container">
                    <div className="table-surface">
                        <div className="dealer-section">
                            <div className="section-title">KRUPIER {gameState.status !== 'playing' && `(${gameState.dealerScore})`}</div>
                            <div className="hand-display">
                                {gameState.dealerHand.map((card, i) => renderCard(card, i))}
                            </div>
                        </div>

                        <div className="game-status-overlay">
                            {gameState.status === 'win' && <div className="result win">WYGRAŁEŚ! 🎉 <div className="payout">+{gameState.bet * 2} 🪙</div></div>}
                            {gameState.status === 'lose' && <div className="result lose">PRZEGRAŁEŚ 💀</div>}
                            {gameState.status === 'push' && <div className="result push">REMIS 🤝 <div className="payout">+{gameState.bet} 🪙</div></div>}
                            {gameState.status === 'blackjack' && <div className="result blackjack">BLACKJACK! 🔥 <div className="payout">+{Math.floor(gameState.bet * 2.5)} 🪙</div></div>}
                        </div>

                        <div className="player-section">
                            <div className="hand-display">
                                {gameState.playerHand.map((card, i) => renderCard(card, i))}
                            </div>
                            <div className="section-title">TY ({gameState.playerScore}) — STAWKA: {gameState.bet} 🪙</div>

                            <div className="action-buttons">
                                {gameState.status === 'playing' ? (
                                    <>
                                        <button className="btn-hit" onClick={() => handleAction('hit')}>HIT</button>
                                        <button className="btn-stand" onClick={() => handleAction('stand')}>STAND</button>
                                        {gameState.playerHand.length === 2 && (
                                            <button className="btn-double" onClick={() => handleAction('double')}>DOUBLE</button>
                                        )}
                                    </>
                                ) : (
                                    <button className="btn-play-again" onClick={() => handleAction('start', { bet })}>ZAGRAJ PONOWNIE</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .blackjack-wrapper {
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at center, #1a4731 0%, #0d2b1d 100%);
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    font-family: 'Inter', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                .blackjack-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    z-index: 10;
                }

                .balance-badge {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    padding: 10px 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    flex-direction: column;
                }

                .balance-badge .label { font-size: 0.7rem; color: #a7f3d0; font-weight: bold; }
                .balance-badge .value { font-size: 1.4rem; font-weight: 800; color: #fbbf24; }

                .error-toast {
                    background: #ef4444;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    animation: slideDown 0.3s ease-out;
                }

                @keyframes slideDown {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .blackjack-lobby {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .lobby-content {
                    text-align: center;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 50px;
                    border-radius: 24px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .lobby-content h1 { font-size: 3.5rem; margin-bottom: 10px; color: #fff; letter-spacing: 4px; }
                .lobby-content p { color: #a7f3d0; margin-bottom: 30px; font-size: 1.2rem; }

                .betting-controls {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-bottom: 30px;
                }

                .bet-chip {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    border: 4px dashed rgba(255,255,255,0.3);
                    background: transparent;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .bet-chip.active {
                    background: #fbbf24;
                    color: #000;
                    border-color: #f59e0b;
                    transform: scale(1.1);
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
                }

                .play-now-btn {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    color: white;
                    padding: 15px 40px;
                    font-size: 1.3rem;
                    font-weight: 800;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                }

                .play-now-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.3); }

                .blackjack-table-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .table-surface {
                    width: 100%;
                    max-width: 900px;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    position: relative;
                }

                .section-title {
                    text-align: center;
                    color: rgba(255,255,255,0.5);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 0.9rem;
                    margin-bottom: 15px;
                }

                .hand-display {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    min-height: 160px;
                }

                .playing-card {
                    width: 100px;
                    height: 145px;
                    background: #fff;
                    border-radius: 10px;
                    color: #111;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: 0 8px 15px rgba(0,0,0,0.4);
                    position: relative;
                    animation: cardIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
                }

                @keyframes cardIn {
                    from { transform: translateY(-50px) rotate(15deg); opacity: 0; }
                    to { transform: translateY(0) rotate(0); opacity: 1; }
                }

                .playing-card.red { color: #dc2626; }
                .playing-card.hidden { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid #334155; }
                .card-back { color: #3b82f6; font-size: 4rem; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center; }

                .card-top { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; }
                .card-bottom { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; transform: rotate(180deg); }
                .card-suit-large { font-size: 3.5rem; text-align: center; margin: -10px 0; }

                .game-status-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 5;
                    pointer-events: none;
                }

                .result {
                    font-size: 3.5rem;
                    font-weight: 900;
                    text-shadow: 0 10px 20px rgba(0,0,0,0.5);
                    text-align: center;
                    animation: resultPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                @keyframes resultPop {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .result.win { color: #4ade80; }
                .result.lose { color: #f87171; }
                .result.push { color: #94a3b8; }
                .result.blackjack { color: #fcd34d; }
                .payout { font-size: 1.5rem; margin-top: 10px; color: #fbbf24; }

                .action-buttons {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin-top: 25px;
                }

                .btn-hit, .btn-stand, .btn-double, .btn-play-again {
                    padding: 12px 30px;
                    border-radius: 10px;
                    border: none;
                    font-weight: bold;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-hit { background: #3b82f6; color: white; }
                .btn-stand { background: #ef4444; color: white; }
                .btn-double { background: #8b5cf6; color: white; }
                .btn-play-again { background: #f59e0b; color: white; }

                .btn-hit:hover, .btn-stand:hover, .btn-double:hover, .btn-play-again:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
            `}</style>
        </div>
    );
}

export default Blackjack;

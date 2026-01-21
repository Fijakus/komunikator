import React, { useState, useEffect } from 'react';

function Battleship({ socket, isActive }) {
    const [status, setStatus] = useState('lobby'); // lobby, waiting, playing, finished
    const [myBoard, setMyBoard] = useState([]);
    const [opponentName, setOpponentName] = useState('');
    const [turn, setTurn] = useState(null);
    const [myShots, setMyShots] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
    const [hitsOnMe, setHitsOnMe] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        if (!isActive) return;

        // Auto-join queue when identifying this component is active
        // But maybe let user click "Graj" first? Let's do auto-join for simplicity.
        // socket.emit('join_game_queue');
        // Let's stick to a button.

        const onGameStart = ({ opponentName, turn }) => {
            setStatus('playing');
            setOpponentName(opponentName);
            setTurn(turn);
            setWinner(null);
            setMyShots(Array(10).fill(null).map(() => Array(10).fill(null)));
            setHitsOnMe(Array(10).fill(null).map(() => Array(10).fill(null)));
        };

        const onMyBoard = (board) => {
            setMyBoard(board);
        };

        const onShotResult = ({ shooter, row, col, result }) => {
            if (shooter === socket.id) {
                // To ja strzelałem
                setMyShots(prev => {
                    const newShots = [...prev.map(r => [...r])];
                    newShots[row][col] = result;
                    return newShots;
                });
            } else {
                // Przeciwnik strzelał do mnie
                setHitsOnMe(prev => {
                    const newHits = [...prev.map(r => [...r])];
                    newHits[row][col] = result;
                    return newHits;
                });
            }
        };

        const onTurnChange = (newTurn) => {
            setTurn(newTurn);
        };

        const onGameOver = ({ winner, reason }) => {
            setStatus('finished');
            setWinner(winner);
            if (reason) alert('Przeciwnik się rozłączył!');
        };

        socket.on('game_start', onGameStart);
        socket.on('my_board', onMyBoard);
        socket.on('shot_result', onShotResult);
        socket.on('turn_change', onTurnChange);
        socket.on('game_over', onGameOver);

        return () => {
            socket.off('game_start', onGameStart);
            socket.off('my_board', onMyBoard);
            socket.off('shot_result', onShotResult);
            socket.off('turn_change', onTurnChange);
            socket.off('game_over', onGameOver);
        };
    }, [socket, isActive]);

    const joinGame = () => {
        socket.emit('join_game_queue');
        setStatus('waiting');
    };

    const handleFire = (row, col) => {
        if (turn !== socket.id) return;
        if (myShots[row][col]) return; // Już tu strzelałem

        socket.emit('game_move', { row, col });
    };

    if (!isActive) return null;

    if (status === 'lobby') {
        return (
            <div className="battleship-lobby">
                <h2>Statki</h2>
                <p>Klasyczna gra w statki dla 2 graczy.</p>
                <button onClick={joinGame} className="play-btn">Znajdź przeciwnika</button>
            </div>
        );
    }

    if (status === 'waiting') {
        return (
            <div className="battleship-lobby">
                <h2>Oczekiwanie...</h2>
                <div className="loader"></div>
                <p>Szukam przeciwnika, proszę czekać.</p>
            </div>
        );
    }

    const isMyTurn = turn === socket.id;

    return (
        <div className="battleship-game">
            <div className="game-header">
                <h3>Przeciwnik: {opponentName}</h3>
                <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
                    {status === 'finished'
                        ? (winner === socket.id ? "WYGRAŁEŚ! 🎉" : "PRZEGRAŁEŚ 💀")
                        : (isMyTurn ? "TWOJA TURA" : "Tura przeciwnika...")}
                </div>
            </div>

            <div className="boards-container">
                <div className="board-section">
                    <h4>Twoja Flota</h4>
                    <div className="board">
                        {myBoard.map((row, r) => (
                            <div key={r} className="board-row">
                                {row.map((cell, c) => {
                                    // cell: 0 = woda, 1 = statek
                                    // hitsOnMe: null, 'HIT', 'MISS'
                                    let className = "cell";
                                    if (cell === 1) className += " ship";
                                    if (hitsOnMe[r][c] === 'HIT') className += " hit";
                                    if (hitsOnMe[r][c] === 'MISS') className += " miss";

                                    return <div key={c} className={className}></div>;
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="board-section">
                    <h4>Radar (Strzelaj tutaj)</h4>
                    <div className={`board ${isMyTurn && status !== 'finished' ? 'active' : 'disabled'}`}>
                        {myShots.map((row, r) => (
                            <div key={r} className="board-row">
                                {row.map((status, c) => {
                                    let className = "cell fog";
                                    if (status === 'HIT') className += " hit";
                                    if (status === 'MISS') className += " miss";

                                    return (
                                        <div
                                            key={c}
                                            className={className}
                                            onClick={() => handleFire(r, c)}
                                        ></div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {status === 'finished' && (
                <button onClick={() => setStatus('lobby')} style={{ marginTop: '20px' }}>Zagraj ponownie</button>
            )}

            <style>{`
                .battleship-game {
                    padding: 20px;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                    overflow-y: auto;
                }
                .battleship-lobby {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: white;
                }
                .play-btn {
                    padding: 15px 40px;
                    font-size: 1.2rem;
                    background: var(--accent);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    margin-top: 20px;
                }
                .boards-container {
                    display: flex;
                    gap: 40px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .board-section h4 { text-align: center; margin-bottom: 10px; }
                .board {
                    display: flex;
                    flex-direction: column;
                    border: 2px solid #334155;
                    background: #0f172a;
                }
                .board-row { display: flex; }
                .cell {
                    width: 30px;
                    height: 30px;
                    border: 1px solid #1e293b;
                    position: relative;
                }
                .cell.ship { background-color: #64748b; }
                .cell.hit { background-color: #ef4444; }
                .cell.hit::after { content: '✕'; position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; }
                .cell.miss { background-color: #3b82f6; opacity: 0.5; }
                .cell.miss::after { content: '•'; position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; }
                .cell.fog { cursor: pointer; }
                .cell.fog:hover { background-color: #1e293b; }
                .board.disabled { opacity: 0.7; pointer-events: none; }
                .turn-indicator {
                    margin-bottom: 20px;
                    padding: 10px 20px;
                    border-radius: 20px;
                    background: #334155;
                    font-weight: bold;
                }
                .turn-indicator.my-turn {
                    background: var(--accent);
                    box-shadow: 0 0 10px var(--accent);
                }
            `}</style>
        </div>
    );
}

export default Battleship;

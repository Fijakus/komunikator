import React, { useState, useEffect } from 'react';

const ShipPart = ({ type, orientation, isHit }) => {
    const color = isHit ? "#ef4444" : "#475569";
    const detailColor = isHit ? "#991b1b" : "#1e293b";
    const textureColor = isHit ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)";

    const style = {
        width: '100%',
        height: '100%',
        display: 'block',
    };

    const renderSVG = () => {
        switch (type) {
            case 'bow': // Dziób
                return (
                    <svg viewBox="0 0 100 100" style={style}>
                        <defs>
                            <linearGradient id="bowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={color} />
                                <stop offset="50%" stopColor={detailColor} />
                                <stop offset="100%" stopColor={color} />
                            </linearGradient>
                        </defs>
                        <path d="M 100,10 C 100,10 20,10 5,50 C 20,90 100,90 100,90 L 100,10" fill="url(#bowGrad)" />
                        <path d="M 100,20 L 40,20 C 35,20 25,35 25,50 C 25,65 35,80 40,80 L 100,80" fill={detailColor} opacity="0.4" />
                        <rect x="80" y="35" width="5" height="30" fill={textureColor} />
                        <circle cx="20" cy="50" r="3" fill="#fbbf24" opacity="0.8" /> {/* Reflektor/Bulaj */}
                    </svg>
                );
            case 'stern': // Rufa
                return (
                    <svg viewBox="0 0 100 100" style={style}>
                        <defs>
                            <linearGradient id="sternGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={color} />
                                <stop offset="50%" stopColor={detailColor} />
                                <stop offset="100%" stopColor={color} />
                            </linearGradient>
                        </defs>
                        <path d="M 0,10 L 85,10 C 95,10 95,90 85,90 L 0,90 L 0,10" fill="url(#sternGrad)" />
                        <rect x="10" y="25" width="60" height="50" rx="2" fill={detailColor} opacity="0.3" />
                        <rect x="20" y="45" width="40" height="10" rx="1" fill={textureColor} />
                        <rect x="75" y="15" width="2" height="70" fill={textureColor} />
                    </svg>
                );
            case 'body': // Środek
                return (
                    <svg viewBox="0 0 100 100" style={style}>
                        <defs>
                            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={color} />
                                <stop offset="50%" stopColor={detailColor} />
                                <stop offset="100%" stopColor={color} />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="10" width="100" height="80" fill="url(#bodyGrad)" />
                        <rect x="25" y="20" width="50" height="60" rx="5" fill={detailColor} opacity="0.4" />
                        <rect x="40" y="30" width="20" height="40" rx="2" fill={detailColor} />
                        <line x1="0" y1="50" x2="100" y2="50" stroke={textureColor} strokeWidth="1" />
                    </svg>
                );
            case 'single': // Mały statek (1x1)
                return (
                    <svg viewBox="0 0 100 100" style={style}>
                        <defs>
                            <radialGradient id="singleGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor={detailColor} />
                                <stop offset="100%" stopColor={color} />
                            </radialGradient>
                        </defs>
                        <path d="M 10,50 C 10,20 90,20 90,50 C 90,80 10,80 10,50 Z" fill="url(#singleGrad)" />
                        <rect x="40" y="40" width="20" height="20" rx="2" fill={detailColor} opacity="0.6" />
                        <circle cx="50" cy="50" r="5" fill="#fbbf24" opacity="0.5" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return renderSVG();
};

function Battleship({ socket, isActive }) {
    const [status, setStatus] = useState('lobby');
    const [myBoard, setMyBoard] = useState([]);
    const [opponentName, setOpponentName] = useState('');
    const [turn, setTurn] = useState(null);
    const [myShots, setMyShots] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
    const [hitsOnMe, setHitsOnMe] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        if (!isActive) return;

        const onGameStart = ({ opponentName, turn }) => {
            setStatus('playing');
            setOpponentName(opponentName);
            setTurn(turn);
            setWinner(null);
            setMyShots(Array(10).fill(null).map(() => Array(10).fill(null)));
            setHitsOnMe(Array(10).fill(null).map(() => Array(10).fill(null)));
        };

        const onMyBoard = (board) => setMyBoard(board);

        const onShotResult = ({ shooter, row, col, result }) => {
            if (shooter === socket.id) {
                setMyShots(prev => {
                    const next = [...prev.map(r => [...r])];
                    next[row][col] = result;
                    return next;
                });
            } else {
                setHitsOnMe(prev => {
                    const next = [...prev.map(r => [...r])];
                    next[row][col] = result;
                    return next;
                });
            }
        };

        const onTurnChange = (newTurn) => setTurn(newTurn);

        const onGameOver = ({ winner, reason }) => {
            setStatus('finished');
            setWinner(winner);
            if (reason) alert('Przeciwnik opuścił grę.');
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
        if (turn !== socket.id || myShots[row][col] || status === 'finished') return;
        socket.emit('game_move', { row, col });
    };

    if (!isActive) return null;

    if (status === 'lobby') {
        return (
            <div className="battleship-lobby">
                <div className="hero-icon">🚢</div>
                <h1>KOMANDOR</h1>
                <p>Zlokalizuj i zniszcz flotę przeciwnika.</p>
                <button onClick={joinGame} className="play-btn">ROZPOCZNIJ STARCIE</button>
            </div>
        );
    }

    if (status === 'waiting') {
        return (
            <div className="battleship-lobby">
                <div className="radar-scanner">
                    <div className="scanner-line"></div>
                </div>
                <h2>SKANOWANIE...</h2>
                <p>Poszukiwanie wrogich jednostek w zasięgu.</p>
            </div>
        );
    }

    const isMyTurn = turn === socket.id;
    const labels_h = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const labels_v = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    return (
        <div className="battleship-game">
            <header className="game-status-bar">
                <div className="turn-alert-container">
                    <div className={`turn-alert ${isMyTurn ? 'active' : ''}`}>
                        {status === 'finished'
                            ? (winner === socket.id ? "ZWYCIĘSTWO" : "PORAŻKA")
                            : (isMyTurn ? "TWOJA KOLEJ" : "CZEKAJ NA RUCH")}
                    </div>
                </div>
            </header>

            <div className="theater-of-war">
                <section className="grid-area">
                    <h3>TWOJA FLOTA</h3>
                    <div className="grid-with-labels">
                        <div className="labels-top">
                            {labels_h.map(l => <div key={l} className="label">{l}</div>)}
                        </div>
                        <div className="grid-main-row">
                            <div className="labels-left">
                                {labels_v.map(l => <div key={l} className="label">{l}</div>)}
                            </div>
                            <div className="grid ocean">
                                {myBoard.map((row, r) => (
                                    <div key={r} className="grid-row">
                                        {row.map((cell, c) => {
                                            const isShipCell = cell === 1 || cell === 2;
                                            const isHit = hitsOnMe[r][c] === 'HIT';
                                            const isMiss = hitsOnMe[r][c] === 'MISS';

                                            let partType = null;
                                            let rotation = 0;

                                            if (isShipCell) {
                                                const hasT = r > 0 && (myBoard[r - 1][c] === 1 || myBoard[r - 1][c] === 2);
                                                const hasB = r < 9 && (myBoard[r + 1][c] === 1 || myBoard[r + 1][c] === 2);
                                                const hasL = c > 0 && (myBoard[r][c - 1] === 1 || myBoard[r][c - 1] === 2);
                                                const hasR = c < 9 && (myBoard[r][c + 1] === 1 || myBoard[r][c + 1] === 2);

                                                if ((hasT || hasB) && !(hasL || hasR)) {
                                                    if (!hasT) { partType = 'bow'; rotation = 270; }
                                                    else if (!hasB) { partType = 'stern'; rotation = 90; }
                                                    else { partType = 'body'; rotation = 90; }
                                                } else if (hasL || hasR) {
                                                    if (!hasL) { partType = 'bow'; rotation = 0; }
                                                    else if (!hasR) { partType = 'stern'; rotation = 180; }
                                                    else { partType = 'body'; rotation = 0; }
                                                } else {
                                                    partType = 'single';
                                                }
                                            }

                                            return (
                                                <div key={c} className={`grid-cell ${isMiss ? 'miss' : ''}`}>
                                                    {partType && (
                                                        <div className="ship-sprite" style={{ transform: `rotate(${rotation}deg)` }}>
                                                            <ShipPart type={partType} isHit={isHit} />
                                                        </div>
                                                    )}
                                                    {isHit && <div className="damage-fx">💥</div>}
                                                    {isMiss && <div className="splash-fx"></div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid-area">
                    <h3>RADAR TAKTYCZNY</h3>
                    <div className="grid-with-labels">
                        <div className="labels-top">
                            {labels_h.map(l => <div key={l} className="label">{l}</div>)}
                        </div>
                        <div className="grid-main-row">
                            <div className="labels-left">
                                {labels_v.map(l => <div key={l} className="label">{l}</div>)}
                            </div>
                            <div className={`grid radar ${isMyTurn && status !== 'finished' ? 'active' : ''}`}>
                                <div className="radar-pulse"></div>
                                {myShots.map((row, r) => (
                                    <div key={r} className="grid-row">
                                        {row.map((res, c) => (
                                            <div key={c} className="grid-cell fog" onClick={() => handleFire(r, c)}>
                                                {res === 'HIT' && <div className="hit-marker">🎯</div>}
                                                {res === 'MISS' && <div className="miss-marker"></div>}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {status === 'finished' && (
                <button className="play-again-btn" onClick={() => setStatus('lobby')}>RESTART OPERACJI</button>
            )}

            <style>{`
                .battleship-game {
                    padding: 30px;
                    background: #0f172a;
                    color: #fff;
                    height: 100%;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-family: 'Outfit', sans-serif;
                    overflow-y: auto;
                }
                .hero-icon { font-size: 4rem; margin-bottom: 1rem; }
                h1 { letter-spacing: 5px; font-weight: 900; margin-bottom: 0.5rem; color: #3b82f6; }
                
                .game-status-bar {
                    margin-bottom: 2rem;
                    width: 100%;
                    max-width: 800px;
                    display: flex;
                    justify-content: center;
                }
                
                .turn-alert { 
                    padding: 10px 40px;
                    border-radius: 30px;
                    background: #1e293b;
                    font-weight: 900; 
                    color: #475569; 
                    letter-spacing: 2px;
                    transition: all 0.4s;
                    border: 1px solid #334155;
                }
                .turn-alert.active { 
                    color: #fff; 
                    background: #2563eb;
                    border-color: #60a5fa;
                    box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);
                }

                .theater-of-war {
                    display: flex;
                    gap: 50px;
                    flex-wrap: wrap;
                    justify-content: center;
                    width: 100%;
                }
                .grid-area h3 { 
                    text-align: center; font-size: 0.8rem; color: #94a3b8; 
                    margin-bottom: 1rem; letter-spacing: 4px;
                }
                
                .grid-with-labels { display: flex; flex-direction: column; }
                .labels-top { display: flex; padding-left: 30px; height: 30px; }
                .labels-top .label { width: 44px; text-align: center; color: #64748b; font-size: 0.8rem; font-weight: bold; }
                .grid-main-row { display: flex; }
                .labels-left { display: flex; flex-direction: column; width: 30px; }
                .labels-left .label { height: 44px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 0.8rem; font-weight: bold; }

                .grid {
                    background: #020617;
                    border: 2px solid #334155;
                    position: relative;
                }
                .grid.ocean { background: #0c1524; }
                .grid.radar.active { border-color: #3b82f6; }

                .grid-row { display: flex; }
                .grid-cell {
                    width: 44px; height: 44px;
                    border: 1px solid rgba(59, 130, 246, 0.1);
                    position: relative;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(15, 23, 42, 0.4);
                }
                .grid-cell.fog { cursor: crosshair; }
                .grid-cell.fog:hover { background: rgba(59, 130, 246, 0.15); box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.3); }

                .ship-sprite { 
                    width: 100%; height: 100%; z-index: 2; 
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));
                }
                
                .damage-fx { 
                    position: absolute; z-index: 5; font-size: 1.5rem; 
                    animation: explode 0.8s ease-out;
                    pointer-events: none;
                }
                @keyframes explode { 
                    0% { transform: scale(0) rotate(0); opacity: 0; } 
                    50% { transform: scale(1.5) rotate(45deg); opacity: 1; }
                    100% { transform: scale(1.2) rotate(20deg); opacity: 0.8; }
                }

                .splash-fx {
                    width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;
                    box-shadow: 0 0 15px #60a5fa; opacity: 0.4;
                    animation: splash 1s infinite alternate;
                }
                @keyframes splash { from { transform: scale(0.8); opacity: 0.3; } to { transform: scale(1.2); opacity: 0.5; } }

                .radar-pulse {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
                    animation: pulse-ring 3s infinite;
                    pointer-events: none;
                }
                @keyframes pulse-ring { from { transform: scale(0.5); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }

                .hit-marker { font-size: 1.4rem; z-index: 3; filter: drop-shadow(0 0 5px red); }
                .miss-marker { width: 8px; height: 8px; background: #475569; border-radius: 50%; }

                .play-btn, .play-again-btn {
                    padding: 12px 30px; background: #3b82f6; color: white; border: none;
                    border-radius: 8px; font-weight: 900; letter-spacing: 2px; cursor: pointer;
                    transition: all 0.2s; margin-top: 2rem;
                }
                .play-btn:hover { background: #2563eb; transform: scale(1.05); }

                .radar-scanner {
                    width: 120px; height: 120px; border: 2px solid #3b82f6; border-radius: 50%;
                    position: relative; margin-bottom: 2rem; background: #0c1524;
                }
                .scanner-line {
                    position: absolute; top: 0; left: 50%; width: 2px; height: 50%;
                    background: #3b82f6;
                    transform-origin: bottom; animation: rotate-scan 2s linear infinite;
                }
                @keyframes rotate-scan { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default Battleship;

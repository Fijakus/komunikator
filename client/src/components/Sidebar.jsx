import React, { useState } from 'react';

function Sidebar({ currentRoom, setRoom, rooms }) {
    const [newRoom, setNewRoom] = useState('');

    const handleCreateRoom = (e) => {
        e.preventDefault();
        if (newRoom.trim()) {
            setRoom(newRoom.trim());
            setNewRoom('');
        }
    };

    return (
        <div className="sidebar">
            <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Pokoje</h3>

            <div className="room-list">
                {rooms.map((r, idx) => (
                    <div
                        key={idx}
                        className={`room-item ${currentRoom === r ? 'active' : ''}`}
                        onClick={() => setRoom(r)}
                    >
                        <div className="room-icon">#</div>
                        <span>{r}</span>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 'auto' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dołącz do prywatnego pokoju</p>
                <form onSubmit={handleCreateRoom}>
                    <input
                        placeholder="Nazwa pokoju..."
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        style={{ fontSize: '0.9rem', padding: '8px' }}
                    />
                    <button type="submit" style={{ marginTop: '5px', padding: '8px' }}>Dołącz</button>
                </form>
            </div>
        </div>
    );
}

export default Sidebar;

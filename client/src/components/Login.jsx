import React, { useState } from 'react';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Komunikator</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Witaj w bezpiecznej przestrzeni komunikacji.
                </p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Wpisz swój nick..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={20}
                    />
                    <button type="submit">Wejdź</button>
                </form>
            </div>
        </div>
    );
}

export default Login;

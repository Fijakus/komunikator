import React, { useState } from 'react';

const LoginForm = ({ onSubmit, loading }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(username, password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Nazwa użytkownika"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                disabled={loading}
                required
            />
            <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Ładowanie...' : 'Zaloguj się'}
            </button>
        </form>
    );
};

export default LoginForm;

import React, { useState } from 'react';

const RegisterForm = ({ onSubmit, loading }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Hasła nie są identyczne');
            return;
        }
        setError('');
        onSubmit(username, password);
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}
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
            <input
                type="password"
                placeholder="Potwierdź hasło"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Rejestrowanie...' : 'Zarejestruj się'}
            </button>
        </form>
    );
};

export default RegisterForm;

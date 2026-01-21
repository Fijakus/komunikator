import React, { useState } from 'react';

function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Wypełnij wszystkie pola');
            return;
        }

        if (isRegistering && password !== confirmPassword) {
            setError('Hasła nie są identyczne');
            return;
        }

        setLoading(true);

        try {
            const endpoint = isRegistering ? '/api/register' : '/api/login';
            const response = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                if (isRegistering) {
                    setError('');
                    setIsRegistering(false);
                    setPassword('');
                    setConfirmPassword('');
                    alert('Rejestracja zakończona pomyślnie! Możesz się teraz zalogować.');
                } else {
                    // Logowanie udane
                    onLogin(data.user);
                }
            } else {
                setError(data.error || 'Wystąpił błąd');
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Komunikator</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                    {isRegistering
                        ? 'Utwórz nowe konto'
                        : 'Witaj w bezpiecznej przestrzeni komunikacji.'}
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        color: '#ff3b30',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

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
                    {isRegistering && (
                        <input
                            type="password"
                            placeholder="Potwierdź hasło"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    )}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Ładowanie...' : (isRegistering ? 'Zarejestruj się' : 'Zaloguj się')}
                    </button>
                </form>

                <div style={{
                    marginTop: '20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '14px'
                }}>
                    {isRegistering ? 'Masz już konto?' : 'Nie masz konta?'}
                    {' '}
                    <button
                        onClick={toggleMode}
                        disabled={loading}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '14px',
                            padding: 0
                        }}
                    >
                        {isRegistering ? 'Zaloguj się' : 'Zarejestruj się'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;

import React, { useState } from 'react';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';

function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginSubmit = async (username, password) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                onLogin(data.user);
            } else {
                setError(data.error || 'Błąd logowania');
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (username, password) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:3001/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                alert('Zarejestrowano! Możesz się zalogować.');
                setIsRegistering(false);
            } else {
                setError(data.error || 'Błąd rejestracji');
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Komunikator</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                    {isRegistering ? 'Utwórz nowe konto' : 'Witaj w bezpiecznej przestrzeni.'}
                </p>

                {error && <div className="error-box">{error}</div>}

                {isRegistering ? (
                    <RegisterForm onSubmit={handleRegisterSubmit} loading={loading} />
                ) : (
                    <LoginForm onSubmit={handleLoginSubmit} loading={loading} />
                )}

                <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {isRegistering ? 'Masz już konto?' : 'Nie masz konta?'}
                    <button onClick={() => setIsRegistering(!isRegistering)} disabled={loading} className="text-link">
                        {isRegistering ? 'Zaloguj się' : 'Zarejestruj się'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;

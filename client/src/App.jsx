import React, { useState } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

// Initialize socket outside component to prevent multiple connections
const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (user) => {
    setUsername(user);
    setIsLoggedIn(true);
    // Optionally notify server of login
    // socket.emit('login', { username: user });
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat socket={socket} username={username} />
      )}
    </div>
  );
}

export default App;

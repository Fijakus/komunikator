import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

// Initialize socket outside component to prevent multiple connections
const socket = io.connect("http://localhost:3001");

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);

    // Authenticate with socket server
    socket.emit('authenticate', {
      userId: userData.id,
      username: userData.username
    });
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat socket={socket} username={user.username} userId={user.id} />
      )}
    </div>
  );
}

export default App;

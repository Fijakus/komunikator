import React from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import { useApp } from './context/AppContext';
import './App.css';

function App() {
  const { isLoggedIn, user, login, socket } = useApp();

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={login} />
      ) : (
        <Chat socket={socket} username={user.username} userId={user.id} />
      )}
    </div>
  );
}

export default App;

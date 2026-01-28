import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const AppContext = createContext();

const SOCKET_URL = "http://localhost:3001";

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [socket, setSocket] = useState(null);

    // Initialize socket
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true
        });
        setSocket(newSocket);

        newSocket.on('force_logout', () => {
            setIsLoggedIn(false);
            setUser(null);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const login = useCallback((userData) => {
        setUser(userData);
        setIsLoggedIn(true);
        if (socket) {
            socket.emit('authenticate', {
                userId: userData.id,
                username: userData.username
            });
        }
    }, [socket]);

    const logout = useCallback(() => {
        setIsLoggedIn(false);
        setUser(null);
    }, []);

    const value = {
        user,
        isLoggedIn,
        socket,
        login,
        logout
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

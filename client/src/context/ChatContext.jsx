import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { socket, user } = useApp();
    const [currentRoom, setCurrentRoom] = useState('public');
    const [messages, setMessages] = useState([]);
    const [rooms] = useState(['public', 'general', 'dev', 'ai-chat', 'statki', 'blackjack']);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join_room', currentRoom);

        const handleMessage = (data) => {
            setMessages((prev) => [...prev, data]);
        };
        const handleHistory = (history) => {
            setMessages(history);
        }

        socket.on('receive_message', handleMessage);
        socket.on('room_history', handleHistory);

        return () => {
            socket.off('receive_message', handleMessage);
            socket.off('room_history', handleHistory);
        };
    }, [socket, currentRoom]);

    const changeRoom = useCallback((room) => {
        if (room !== currentRoom) {
            setMessages([]);
            setCurrentRoom(room);
        }
    }, [currentRoom]);

    const sendMessage = useCallback(async (content, fileData = null) => {
        if (!socket || !currentRoom) return;

        const messageData = {
            room: currentRoom,
            content,
            file: fileData,
            type: fileData ? 'file' : 'text',
        };

        socket.emit('send_message', messageData);
    }, [socket, currentRoom]);

    const value = {
        currentRoom,
        messages,
        rooms,
        changeRoom,
        sendMessage
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    return useContext(ChatContext);
};

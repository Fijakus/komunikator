import React from 'react';
import Sidebar from './Sidebar';
import Battleship from './Battleship';
import Blackjack from './Blackjack';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';
import { ChatProvider, useChat } from '../context/ChatContext';
import { useApp } from '../context/AppContext';

const ChatContent = () => {
    const { socket, user } = useApp();
    const { currentRoom, rooms, changeRoom } = useChat();

    return (
        <div className="app-container">
            <Sidebar
                currentRoom={currentRoom}
                setRoom={changeRoom}
                rooms={rooms}
            />

            <div className="chat-area">
                {currentRoom === 'statki' ? (
                    <Battleship socket={socket} isActive={true} />
                ) : currentRoom === 'blackjack' ? (
                    <Blackjack socket={socket} isActive={true} />
                ) : (
                    <>
                        <MessageList />
                        <MessageInput />
                    </>
                )}
            </div>
        </div>
    );
};

const Chat = () => {
    return (
        <ChatProvider>
            <ChatContent />
        </ChatProvider>
    );
};

export default Chat;

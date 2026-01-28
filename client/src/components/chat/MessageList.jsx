import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { useChat } from '../../context/ChatContext';

const MessageList = () => {
    const { messages } = useChat();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="messages-container">
            {messages.map((msg, index) => (
                <MessageItem key={index} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;

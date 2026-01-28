import React from 'react';
import { useApp } from '../../context/AppContext';

const MessageItem = ({ msg }) => {
    const { user } = useApp();
    const isMe = msg.username === user.username;

    return (
        <div className={`message ${isMe ? 'sent' : 'received'}`}>
            <div className="message-meta">
                <span>{msg.username}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="message-content">
                {msg.content}
            </div>
            {(msg.file || msg.file_data) && (
                <div className="message-file">
                    {(msg.file || msg.file_data).startsWith('data:image') ? (
                        <img src={msg.file || msg.file_data} alt="attachment" className="preview" />
                    ) : (
                        <a href={msg.file || msg.file_data} download="file" style={{ color: 'var(--text-main)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            📄 Pobierz plik
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageItem;

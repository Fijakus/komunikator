import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Battleship from './Battleship';

function Chat({ socket, username }) {
    const [currentRoom, setCurrentRoom] = useState('public');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [file, setFile] = useState(null);
    const messagesEndRef = useRef(null);
    const [showEmoji, setShowEmoji] = useState(false);

    const predefinedRooms = ['public', 'general', 'dev', 'ai-chat', 'statki'];

    const emojis = ['😀', '😂', '😍', '👍', '🎉', '🔥', '😎', '🤔', '❤️', '🚀'];
    useEffect(() => {
        // Join default room
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if ((message.trim() || file) && currentRoom) {
            let fileData = null;
            if (file) {
                fileData = await convertBase64(file);
            }

            const messageData = {
                room: currentRoom,
                content: message,
                file: fileData,
                type: file ? 'file' : 'text',
            };

            await socket.emit('send_message', messageData);

            setMessage('');
            setFile(null);
            setShowEmoji(false);
        }
    };

    const convertBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
                resolve(fileReader.result);
            };
            fileReader.onerror = (error) => {
                reject(error);
            };
        });
    };

    const insertEmoji = (emoji) => {
        setMessage((prev) => prev + emoji);
    };

    const handleRoomChange = (room) => {
        if (room !== currentRoom) {
            setMessages([]); // Clear chat on switch or wait for history
            setCurrentRoom(room);
        }
    };

    return (
        <div className="app-container">
            <Sidebar
                currentRoom={currentRoom}
                setRoom={handleRoomChange}
                rooms={predefinedRooms}
            />

            <div className="chat-area">
                {currentRoom === 'statki' ? (
                    <Battleship socket={socket} isActive={true} />
                ) : (
                    <>
                        <div className="messages-container">
                            {messages.map((msg, index) => {
                                const isMe = msg.username === username;
                                return (
                                    <div key={index} className={`message ${isMe ? 'sent' : 'received'}`}>
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
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-area">
                            {showEmoji && (
                                <div style={{ position: 'absolute', bottom: '80px', background: '#1e293b', padding: '10px', borderRadius: '10px', border: '1px solid #334155' }}>
                                    {emojis.map(e => <span key={e} style={{ cursor: 'pointer', fontSize: '1.5rem', margin: '5px' }} onClick={() => insertEmoji(e)}>{e}</span>)}
                                </div>
                            )}

                            <button type="button" className="btn-icon" onClick={() => setShowEmoji(!showEmoji)}>
                                😊
                            </button>

                            <label className="file-label">
                                📎
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {file && <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{file.name}</span>}

                            <form onSubmit={sendMessage} style={{ flex: 1, display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Napisz wiadomość..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    style={{ marginTop: 0 }}
                                />
                                <button type="submit" style={{ width: 'auto', marginTop: 0 }}>Wyślij</button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Chat;

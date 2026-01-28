import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];

const MessageInput = () => {
    const { sendMessage } = useChat();
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [error, setError] = useState('');

    const emojis = ['😀', '😂', '😍', '👍', '🎉', '🔥', '😎', '🤔', '❤️', '🚀'];

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('Plik jest zbyt duży (maks. 5MB)');
            return;
        }

        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Niedozwolony typ pliku');
            return;
        }

        setError('');
        setFile(selectedFile);
    };

    const convertBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((message.trim() || file)) {
            let fileData = null;
            if (file) {
                fileData = await convertBase64(file);
            }

            await sendMessage(message, fileData);

            setMessage('');
            setFile(null);
            setShowEmoji(false);
            setError('');
        }
    };

    const insertEmoji = (emoji) => {
        setMessage((prev) => prev + emoji);
    };

    return (
        <div className="chat-input-wrapper">
            {error && <div className="input-error-msg">{error}</div>}
            <div className="chat-input-area">
                {showEmoji && (
                    <div className="emoji-picker">
                        {emojis.map(e => (
                            <span key={e} onClick={() => insertEmoji(e)}>{e}</span>
                        ))}
                    </div>
                )}

                <button type="button" className="btn-icon" onClick={() => setShowEmoji(!showEmoji)}>
                    😊
                </button>

                <label className="file-label">
                    📎
                    <input
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </label>
                {file && <span className="file-name-indicator">{file.name}</span>}

                <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: '10px' }}>
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
            <style jsx="true">{`
                .chat-input-wrapper { position: relative; }
                .input-error-msg { 
                    position: absolute; top: -35px; left: 20px; 
                    background: #ef4444; color: white; padding: 4px 12px; 
                    border-radius: 6px; font-size: 0.8rem; z-index: 100;
                }
                .emoji-picker {
                    position: absolute; bottom: 80px; background: #1e293b; 
                    padding: 10px; borderRadius: 10px; border: 1px solid #334155;
                    display: flex; flex-wrap: wrap; gap: 5px; width: 220px;
                }
                .emoji-picker span { cursor: pointer; font-size: 1.5rem; transition: transform 0.1s; }
                .emoji-picker span:hover { transform: scale(1.2); }
                .file-name-indicator { font-size: 0.8rem; color: var(--primary-color); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            `}</style>
        </div>
    );
};

export default MessageInput;

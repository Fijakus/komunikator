const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'server.log');

const formatMessage = (level, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}\n`;
};

const logger = {
    info: (msg) => {
        const formatted = formatMessage('info', msg);
        console.log(formatted.trim());
        fs.appendFileSync(logFile, formatted);
    },
    error: (msg, stack) => {
        const formatted = formatMessage('error', `${msg}${stack ? `\n${stack}` : ''}`);
        console.error(formatted.trim());
        fs.appendFileSync(logFile, formatted);
    },
    warn: (msg) => {
        const formatted = formatMessage('warn', msg);
        console.warn(formatted.trim());
        fs.appendFileSync(logFile, formatted);
    }
};

module.exports = logger;

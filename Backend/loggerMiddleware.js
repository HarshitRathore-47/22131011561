// loggerMiddleware.js
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'access.log');

function requestLogger(req, res, next) {
  const startTime = new Date();
  
  res.on('finish', () => {
    const logEntry = `${startTime.toISOString()} [${req.method}] ${req.originalUrl} ${res.statusCode} - IP: ${req.ip}\n`;
    // Append log entry asynchronously - simulate production logger
    fs.appendFile(logFilePath, logEntry, (err) => {
      if (err) {
        // You must NOT use console.log or built-in loggers, so here we silently ignore
      }
    });
  });

  next();
}

function logInfo(message) {
  const time = new Date().toISOString();
  const logMessage = `[INFO] ${time} - ${message}\n`;
  fs.appendFile(logFilePath, logMessage, () => {});
}

function logError(message) {
  const time = new Date().toISOString();
  const logMessage = `[ERROR] ${time} - ${message}\n`;
  fs.appendFile(logFilePath, logMessage, () => {});
}

module.exports = {
  requestLogger,
  logInfo,
  logError
};
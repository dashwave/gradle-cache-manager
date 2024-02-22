import winston from 'winston';

// Define your custom levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
};

// Create the logger
const logger = winston.createLogger({
  levels: levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // to log stack traces
    winston.format.splat(),
    winston.format.json() // Log in JSON format for easier processing
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Colorize log levels
        winston.format.simple() // Simple format for readability
      ),
    }),
    // File transport
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error', // Only log error level messages to this file
    }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
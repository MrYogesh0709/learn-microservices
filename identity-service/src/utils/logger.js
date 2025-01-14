const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "identity-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Custom log methods for structured logging
const structuredLog = (level, message, meta) => {
  if (typeof meta === "string") {
    meta = { message: meta }; // Ensure it's always an object
  }
  logger.log(level, message, meta);
};

// Convenience methods
logger.infoWithMeta = (message, meta) => structuredLog("info", message, meta);
logger.warnWithMeta = (message, meta) => structuredLog("warn", message, meta);
logger.errorWithMeta = (message, meta) => structuredLog("error", message, meta);

module.exports = logger;

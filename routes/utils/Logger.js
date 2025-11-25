"use strict";

const path = require("path");
const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");

const MSGCODE = {

    100: "Server working",

    400: "System external error",

    999: "Debug"
};

const logFormat = format.printf(({ level, message, msgcode, timestamp }) => {
    let codeText = "";
    if (msgcode) {
        const mapped = MSGCODE[msgcode] || "Undefined message code";
        codeText = `[CODE${msgcode}] ${mapped}`;
        if (message) {
            codeText += ` (${message})`;
        }
    } else {
        codeText = message;
    }
    return `${timestamp} [${level.toUpperCase()}]${codeText}`;
});

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.errors({ stack: true }),
        format.splat(),
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
            filename: `${path.resolve(process.env.LOG_PATH)}/systemLog-%DATE%.log`,
            datePattern: "YYYYMMDD",
            zippedArchive: true,
            level: "info",
        }),
    ],
});

function wrapLoggerMethod(originalMethod, level) {
    return function (codeOrMsg, msg) {
        if (typeof codeOrMsg === "number") {
            const msgcode = codeOrMsg;
            const message = msg;
            return originalMethod.call(logger, { msgcode, message });
        }
        return originalMethod.call(logger, codeOrMsg);
    };
}

logger.info = wrapLoggerMethod(logger.info, "info");
logger.error = wrapLoggerMethod(logger.error, "error");
logger.warn = wrapLoggerMethod(logger.warn, "warn");

module.exports = logger;

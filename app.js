"use strict";

require("dotenv").config();

const path = require("path");
const fs = require("fs-extra");
const http = require("http");
const debug = require("debug")("express-kit:server");
const createError = require("http-errors");

const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const morgan = require("morgan");
const rotatingLogStream = require("file-stream-rotator");
const cors = require("cors");

const router = require("./routes/Router");
const logger = require("./routes/utils/Logger");

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    })
);

morgan.token("date", () => {
    const d = new Date();
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
});

const logDir = process.env.LOG_PATH;
fs.ensureDirSync(logDir);

app.use(
    morgan("combined", {
        stream: rotatingLogStream.getStream({
            filename: path.join(logDir, "streamLog-%DATE%.log"),
            frequency: "daily",
            verbose: false,
            date_format: "YYYYMMDD",
        }),
    })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
    session({
        secret: "@#@$MYSIGN#@$#$",
        resave: false,
        saveUninitialized: true,
    })
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/", router);

app.use((req, res, next) => {
    next(createError(404, "Not Found"));
});

app.use((err, req, res, next) => {
    logger.error(400, err.message);

    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status || 500);
    res.render("error.html");
});

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val) {
    const portNum = parseInt(val, 10);
    return isNaN(portNum) ? val : portNum >= 0 ? portNum : false;
}

function onError(error) {
    if (error.syscall !== "listen") throw error;

    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    switch (error.code) {
        case "EACCES":
            logger.error(400, `${bind} requires elevated privileges`);
            process.exit(1);
        case "EADDRINUSE":
            logger.error(400, `${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind =
        typeof addr === "string" ? "pipe " + addr : "port " + addr.port;

    logger.info(100, `Server listening on ${bind}`);
    debug(`Listening on ${bind}`);
}

module.exports = app;

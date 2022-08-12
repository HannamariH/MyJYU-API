"use strict"

const winston = require('winston')

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.prettyPrint()
    ),
    transports: [
        new winston.transports.File({
            filename: "./logs/error.log",
            level: "error"
        }),
        new winston.transports.File({
            filename: "./logs/info.log",
            level: "info"
        })
    ]
})

module.exports = { logger }
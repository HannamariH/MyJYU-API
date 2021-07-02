"use strict"

const winston = require('winston')


const errorLogger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: "./logs/error.log",
            level: "error"
        })
    ]
})

const infoLogger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: "./logs/cardnumber.log",
            level: "info"
        })
    ]
})

module.exports = { errorLogger, infoLogger }
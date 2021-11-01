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

module.exports = { errorLogger }
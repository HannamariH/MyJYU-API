"use strict"

require('dotenv').config()
const Koa = require('koa')
const Router = require('koa-router')
const axios = require('axios')
const bodyParser = require('koa-body')
const openapi = require('koa-openapi')
const fs = require('fs')
const path = require('path')
const winston = require('winston')
const fs = require('fs')


const app = new Koa()

app.use(bodyParser({
    multipart: true,
    urlencoded: true
}))

const router = new Router()
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


openapi.initialize({
    apiDoc: fs.readFileSync(path.resolve(__dirname, 'api-doc.yml'), 'utf8'),
    router,
    paths: path.resolve(__dirname, 'api-routes'),
})

app.use(router.routes())
module.exports = app
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`running on port ${PORT}`))
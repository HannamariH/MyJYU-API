"use strict"

require('dotenv').config()
const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-body')
const openapi = require('koa-openapi')
const fs = require('fs')
const path = require('path')

const app = new Koa()
const router = new Router()

app.use(bodyParser({
    multipart: true,
    urlencoded: true
}))

openapi.initialize({
    apiDoc: fs.readFileSync(path.resolve(__dirname, 'api-doc.yml'), 'utf8'),
    router,
    paths: path.resolve(__dirname, 'api-routes'),
})

app.use(router.routes())

module.exports = app

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`running on port ${PORT}`))
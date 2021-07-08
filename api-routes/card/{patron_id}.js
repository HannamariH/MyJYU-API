'use strict'

const axios = require('axios')
const { baseAddress } = require("../../utils")
const { errorLogger } = require("../../logger")

const removePatron = async (patron_id) => {
    try {
        const removedPatron = await axios ({
            method: "delete", url: `${baseAddress}/patrons/${patron_id}`, headers: {
                'Authorization': `Basic ${process.env.BASIC}`
            }
        })
        return removedPatron.status
    } catch (error) {
        if (error.response == undefined) {
            errorLogger.error({
                timestamp: new Date().toLocaleString(),
                message: "Koha timeout",
                url: error.config.url,
                method: "delete"
            })
            return 500
        } else {
            errorLogger.error({
                timestamp: new Date().toLocaleString(),
                message: error.response.data.error,  
                status: error.response.status,
                url: error.config.url,
                method: "delete"
            })
            return error.response.status
        }      
    }
}


// only for testing purposes, no patron deleting from MyJYU app!
async function remove(ctx) {
    ctx.status = await removePatron(ctx.params.patron_id)
}

module.exports = {
    delete: remove,
    removePatron
}
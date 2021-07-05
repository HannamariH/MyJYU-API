'use strict'

const { getToken, searchIdp, getPatron, postNewPin } = require("../../utils")
const { errorLogger } = require("../../loggers")

async function post(ctx) {
    const token = getToken(ctx)
    if (!token) {
        return ctx.status = 401
    }
    const person = await searchIdp(token)
    const personData = {
        username: person.data.preferred_username,
        firstname: person.data.given_name,
        surname: person.data.family_name,
        email: person.data.email,
        streetAddress: person.data.home_street_address,
        zip: person.data.home_zip_code,
        city: person.data.home_city,
        ssn: person.data.ssn
    }
    const patron = await getPatron(personData)
    if (!patron) {
        return ctx.status = 404
    }
    const patronId = patron.patron_id
    const newPin = ctx.request.body.pin1
    const newPin2 = ctx.request.body.pin2

    await postNewPin(newPin, newPin2, patronId)
        .then(() => {
            ctx.response.status = 200
        }).catch((error) => {
            errorLogger.error({
                timestamp: new Date().toLocaleString(),
                message: error.response.data.error,
                status: error.response.status,
                url: error.config.url,
                method: "post"
            })
            ctx.response.status = error.response.status
        })
}

module.exports = {
    post: post
}
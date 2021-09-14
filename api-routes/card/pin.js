'use strict'

const { getToken, searchIdp, getPatron, postNewPin, validatePins } = require("../../utils")
const { errorLogger } = require("../../logger")

async function post(ctx) {
    const token = getToken(ctx)
    if (!token) {
        return ctx.status = 401
    }

    const pinsValid = validatePins(ctx.request.body.pin1, ctx.request.body.pin2)
    if (!pinsValid) {
        return ctx.status = 400
    }

    let person = null
    try {
        person = await searchIdp(token)
    } catch (error) {
        return ctx.status = error.response.status
    }
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

    let patron = null
    try {
        patron = await getPatron(personData)
        if (!patron) {
            return ctx.status = 404 
        } 
    } catch (error) {
        errorLogger.error({
            timestamp: new Date().toLocaleString('fi-FI'),
            message: "Error searching Koha for the right patron",
            status: error.response.status
        })
        ctx.response.status = error.response.status
    }
    const patronId = patron.patron_id
    const newPin = ctx.request.body.pin1
    const newPin2 = ctx.request.body.pin2

    try {
        await postNewPin(newPin, newPin2, patronId)
        ctx.response.status = 200
    } catch (error) {
        if (error.response == undefined) {
            errorLogger.error({
                timestamp: new Date().toLocaleString('fi-FI'),
                message: "Koha timeout",
                url: error.config.url,
                method: "post"
            })
            return 500
        } else {
            errorLogger.error({
                timestamp: new Date().toLocaleString('fi-FI'),
                message: error.response.data.error,
                status: error.response.status,
                url: error.config.url,
                method: "post"
            })
            ctx.response.status = error.response.status
        }        
    }
}

module.exports = {
    post: post
}
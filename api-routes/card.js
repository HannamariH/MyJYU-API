'use strict'

const axios = require('axios')
const fs = require('fs')
const { getToken, searchIdp, getPatron, postNewPin, getDateOfBirth, validatePins, baseAddress } = require("../utils")
const { logger } = require("../logger")

const faculties = {
    "AVOIN": "T",
    "HYTK": "H",
    "IT": "I",
    "JSBE": "J",
    "KPTK": "S",
    "KTL": "E",
    "KYC": "E",
    "MLTK": "M",
    "MOVI": "E",
    "OSC": "E",
    "SPORT": "L",
    "YOP": "E",
    "EDU": "S",
    "HUM": "H",
    "YTK": "H",
    "JY-ORG-12": "T",
    "JY-ORG-24": "H",
    "JY-ORG-25": "I",
    "JY-ORG-27": "J",
    "JY-ORG-39": "S",
    "JY-ORG-55": "M",
    "JY-ORG-52": "L",
    "JY-ORG-35": "E",
    "NORIGHTS": "",
    "ULC": ""    
}

const category = {
    student: "E",
    staff: "B"
}

const getNextCardnumber = () => {
    try {
        const lastNumber = fs.readFileSync("logs/cardnumber.log", "utf8")
        return parseInt(lastNumber) + 1
    } catch (error) {
        logger.error({
            message: "Could not read cardnumber.log"
        })
    }
}

const logUsedCardnumber = (number) => {
    try {
        fs.writeFileSync("logs/cardnumber.log", number.toString())
    } catch (error) {
        logger.error({
            message: "Could not write to cardnumber.log"
        })
    }
}

const savePatron = async (data) => {
    try {
        const newPatron = await axios({
            method: "post", url: `${baseAddress}/patrons`, headers: {
                'Authorization': `Basic ${process.env.BASIC}`,
                'User-Agent': 'MyJYU api'
            }, data
        })
        return newPatron
    } catch (error) {
        if (error.response.status == 409) {
            data.cardnumber = parseInt(data.cardnumber) + 1
            data.userid = data.cardnumber
            return await savePatron(data)
        } else if (error.response == undefined) {
            logger.error({
                message: "Koha timeout",
                url: error.config.url,
                method: "post"
            })
            return 500
        } else {
            let errorMessage = error.response.data.error
            /*if (errorMessage.includes("Your action breaks a unique constraint on the attribute. type=SSN")) {
                errorMessage = "Your action breaks a unique constraint on the attribute. type=SSN"
            }*/
            logger.error({
                message: "Other error in posting patron to Koha: " + errorMessage,
                status: error.response.status,
                url: error.config.url,
                method: "post"
            })
            if (errorMessage.includes("Your action breaks a unique constraint on the attribute. type=SSN")) {
                return 409
            }
            return
        }

    }

}

const removePatron = async (patron_id) => {
    try {
        const removedPatron = await axios({
            method: "delete", url: `${baseAddress}/patrons/${patron_id}`, headers: {
                'Authorization': `Basic ${process.env.BASIC}`,
                'User-Agent': 'MyJYU api'
            }
        })
        return removedPatron.status
    } catch (error) {
        if (error.response == undefined) {
            logger.error({
                message: "Koha timeout",
                url: error.config.url,
                method: "delete"
            })
            return 500
        } else {
            logger.error({
                message: error.response.data.error,
                status: error.response.status,
                url: error.config.url,
                method: "delete"
            })
            return error.response.status
        }
    }
}

const createOthername = () => {
    const unixepoch = Math.round((new Date()).getTime() / 10).toString()
    const epochdashed = unixepoch.replace(/(....)/g, '$1-').replace(/-$/,'')
    return epochdashed
}

//-----------------routes-------------------------


async function get(ctx) {
    const token = getToken(ctx)
    if (!token) {
        return ctx.status = 401
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
            logger.info({
                message: "Patron not found in Koha",
                patron: personData
            })
            return ctx.status = 404
        }
    } catch (error) {
        logger.error({
            message: "Error searching Koha for the right patron",
        })
        ctx.response.status = 500
    }

    logger.info({
        message: "Card succesfully got",
        patron: personData
    })

    //jos k??ytt??j??n kirjastokortin numerona Kohassa on JYU:n k??ytt??j??tunnus (kirjastokorttilomakkeen t??ytt??neet),
    //luodaan k??ytt??j??lle uusi mobiilikorttinumero ja tallennetaan se Kohaan
    const usernameRegex = /^[a-z]+$/
    let cardnumber = patron.cardnumber

    if (usernameRegex.test(cardnumber)) {
        const newCardnumber = getNextCardnumber()
        const data = {
            cardnumber: newCardnumber,
            userid: newCardnumber,
            //Kohan REST API vaatii seuraavat
            surname: patron.surname,
            address: patron.address,
            city: patron.city,
            library_id: patron.library_id,
            category_id: patron.category_id
        }
        try {
            const modifiedPatron = await axios({
                method: "put", url: `${baseAddress}/patrons/${patron.patron_id}`, headers: {
                    'Authorization': `Basic ${process.env.BASIC}`,
                    'User-Agent': 'MyJYU api'
                }, data
            })
            logUsedCardnumber(modifiedPatron.data.cardnumber)
            cardnumber = modifiedPatron.data.cardnumber
            logger.info({
                message: "Changed JYU username to mobile card number",
                patron: data
            })
        } catch (error) {
            logger.error({
                message: "Error with changing cardnumber from JYU username to mobile card number",
                patron: data
            })
        }
    }

    ctx.body = {
        cardnumber: cardnumber,
        hold_code: patron.other_name,
        patron_id: patron.patron_id       
    }
}


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
    const cardnumber = getNextCardnumber()
    let dateOfBirth = null
    try {
        dateOfBirth = getDateOfBirth(person.data.ssn)
    } catch (error) {
        return ctx.status = 400
    }
    let role = null
    let categoryCode = null
    const facultyCode = person.data.faculty_code.toUpperCase().replace("ROTI-TDK-", "")
    if (typeof person.data.roles === "string") {
        role = person.data.roles.toUpperCase()
        categoryCode = category[person.data.roles] + faculties[facultyCode]
    } else {
        role = person.data.roles[0].toUpperCase()
        categoryCode = category[person.data.roles[0]] + faculties[facultyCode]
    }
    if (role === "VISITOR") {
        role = "STUDENT"
        categoryCode = "P"
    }

    logger.info({
        message: "Trying to add patron, data from IDM:",
        patron: person.data
    })

    const data = {
        address: person.data.home_street_address,
        postal_code: person.data.home_zip_code,
        city: person.data.home_city,
        cardnumber: cardnumber,
        firstname: person.data.given_name,
        surname: person.data.family_name,
        other_name: createOthername(),
        email: person.data.email,
        phone: ctx.request.body.phone,
        date_of_birth: dateOfBirth,
        category_id: role, //Kohan API vaatii
        library_id: "MAIN",
        userid: cardnumber,
        extended_attributes: [
            { type: "SSN", value: person.data.ssn },
            { type: "STAT_CAT", value: categoryCode }
        ],
        altcontact_firstname: person.data.preferred_username
    }

    let newPatron = null
    try {
        newPatron = await savePatron(data)
    } catch (error) {
        return ctx.status = error.response.status
    }
    //logging to help solve problems with category codes
    if (newPatron && newPatron != 409) {
        logger.info({
            message: "Patron added to Koha",
            patron: data
        })
    } else {
        logger.error({
            message: "Patron not added to Koha",
            patron: data
        })
    }
    if (!newPatron) {
        return ctx.status = 500
    } else if (newPatron == 409) {
        return ctx.status = 409
    } else {
        logUsedCardnumber(newPatron.data.cardnumber)
        const patronId = newPatron.data.patron_id
        const newPin = ctx.request.body.pin1
        const newPin2 = ctx.request.body.pin2
        try {
            await postNewPin(newPin, newPin2, patronId)
            ctx.status = 201
            ctx.response.body = {
                patron_id: patronId,
                cardnumber: newPatron.data.cardnumber
            }
            return
        } catch (error) {
            let removed = null
            try {
                removed = await removePatron(patronId)
            } catch (error) {
                logger.error({
                    message: "Could not remove patron whose pin code is missing",
                    status: removed,
                    method: "delete"
                })
                ctx.status = removed
                ctx.response.body = {
                    message: "Could not remove patron whose pin code is missing"
                }
                return
            }
            logger.error({
                message: error.response.data.error,
                status: error.response.status,
                url: error.config.url,
                method: "post"
            })
            return ctx.status = error.response.status
        }
    }
}

module.exports = {
    get: get,
    post: post
}
'use strict'

const axios = require('axios')
const fs = require('fs')
const { getToken, searchIdp, getPatron, postNewPin, getDateOfBirth, baseAddress, testBaseAddress } = require("../utils")
const { errorLogger } = require("../logger")

const faculties = {
    AVOIN: "T",
    HYTK: "H",
    IT: "I",
    JSBE: "J",
    KPTK: "S",
    KTL: "E",
    KYC: "E",
    MLTK: "M",
    MOVI: "E",
    OSC: "E",
    SPORT: "L",
    YOP: "E"
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
        errorLogger.error({
            timestamp: new Date().toLocaleString(),
            message: "Could not read cardnumber.log"
        })
    }
}

const logUsedCardnumber = (number) => {
    try {
        fs.writeFileSync("logs/cardnumber.log", number.toString())
    } catch (error) {
        errorLogger.error({
            timestamp: new Date().toLocaleString(),
            message: "Could not write to cardnumber.log"
        })
    }
}

const savePatron = async (data) => {
    try {
        const newPatron = await axios({
            method: "post", url: `${baseAddress}/patrons`, headers: {
                'Authorization': `Basic ${process.env.BASIC}`
            }, data
        })
        return newPatron
    } catch (error) {
        if (error.response.status == 409) {
            data.cardnumber = parseInt(data.cardnumber) + 1
            data.userid = data.cardnumber
            return await savePatron(data)
        } else {
            let errorMessage = error.response.data.error
            if (errorMessage.includes("Your action breaks a unique constraint on the attribute. type=SSN")) {
                errorMessage = "Your action breaks a unique constraint on the attribute. type=SSN"
            }
            errorLogger.error({
                timestamp: new Date().toLocaleString(),
                message: errorMessage,
                status: error.response.status,
                url: error.config.url,
                method: "post"
            })
            if (errorMessage == "Your action breaks a unique constraint on the attribute. type=SSN") {
                return 409
            }
            return
        }
    
    }

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
    // TODO: pitäiskö laittaa try catchiin?
    const patron = await getPatron(personData)
    if (!patron) {
        return ctx.status = 404
    }
    ctx.body = {
        cardnumber: patron.cardnumber
    }
}


async function post(ctx) {
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
    const categoryCode = category[person.data.roles[0]] + faculties[person.data.faculty_code]

    const cardnumber = getNextCardnumber()

    const dateOfBirth = getDateOfBirth(person.data.ssn)

    const data = {
        address: ctx.request.body.address,
        city: ctx.request.body.city,
        postal_code: ctx.request.body.postal_code,
        cardnumber: cardnumber,
        firstname: person.data.given_name,
        surname: person.data.family_name,
        other_name: person.data.name,
        email: ctx.request.body.email,
        phone: ctx.request.body.phone,
        date_of_birth: dateOfBirth,
        category_id: person.data.roles[0].toUpperCase(), //IDP:stä (STUDENT/STAFF, Kohan API vaatii!)
        library_id: "MATTILA", //kaikille Lähde? (Nyt Mattila?)
        userid: cardnumber,
        extended_attributes: [
            //{ type: "SSN", value: person.data.ssn },
            { type: "SSN", value: "050101-0101" },
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
                patron_id : patronId
            }
            return
        } catch (error) {
            console.log(error)
            //TODO: poistetaanko tässä pin-kooditon asiakas?
            errorLogger.error({
                timestamp: new Date().toLocaleString(),
                message: error.response.data.error,
                status: error.response.status,
                url: error.config.url,
                method: "post"
            })
            return ctx.status = error.response.status
        }
    }
}

async function remove(ctx) {

}

// TODO: miten delete-funktio nimetään/exportataan?
module.exports = {
    get: get,
    post: post,
    delete: remove
}
'use strict'

const axios = require('axios')
const { getToken, searchIdp, getPatron, postNewPin, getNextCardnumber, getDateOfBirth, baseAddress, testBaseAddress } = require("../utils")
const { errorLogger, infoLogger } = require("../loggers")

const faculties = {
    AVOIN : "T",
    HYTK : "H",
    IT : "I",
    JSBE : "J",	
    KPTK : "S",	
    KTL : "E",
    KYC : "E",
    MLTK : "M",
    MOVI : "E",
    OSC : "E",
    SPORT : "L",
    YOP : "E"
}

const category = {
    student : "E",
    staff : "B"
}


async function get(ctx) {
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
    ctx.body = {
        cardnumber: patron.cardnumber
    }
}


async function post(ctx) {
    const token = getToken(ctx)
    if (!token) {
        return ctx.status = 401
    }
    const person = await searchIdp(token)

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
            { type: "SSN", value: "010101-0101" },
            { type: "STAT_CAT", value: categoryCode }
        ],
        altcontact_firstname: person.data.preferred_username
    }

    let newPatron = null
    try {
        newPatron = await axios({
        method: "post", url: `${baseAddress}/patrons`, headers: {
            'Authorization': `Basic ${process.env.BASIC}`
        }, data
    })
    } catch (error) {
        //TODO: 409, jos sama korttinro on jo käytössä. Pitäis käsitellä tässä!
        return ctx.status = error.response.status
    }

    if (!newPatron.data.patron_id) {
        ctx.status = 500
    } else {
        const patronId = newPatron.data.patron_id
        const newPin = ctx.request.body.pin1
        const newPin2 = ctx.request.body.pin2
        try {
            await postNewPin(newPin, newPin2, patronId)
            //TODO: tarvitaanko responseen bodya? jos, niin päivitä yaml
            // joo, vois palauttaa patronId:n, niin voi testatessa poistaakin sillä
            return ctx.status = 201
                /*ctx.body = {
                    patronId : patron_id
                }*/
            
        } catch (error) {
            return ctx.status = error.response.status
        }
    }
}


module.exports = {
    get: get,
    post: post
}
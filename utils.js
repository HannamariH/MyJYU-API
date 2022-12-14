'use strict'

const axios = require('axios')
const { logger } = require("./logger")

// Testi-Kohan osoite
//const baseAddress = "https://koha-kktest.lib.helsinki.fi/api/v1"
const baseAddress = "https://app1.jyu.koha.csc.fi/api/v1"

const putSsn = async (cand, trimmedCandSsn) => {
    const data = [
            { type: "SSN", value: trimmedCandSsn }
        ]    
    try {
        await axios({
            method: "put", url: `${baseAddress}/patrons/${cand.patron_id}/extended_attributes`, headers: {
                'Authorization': `Basic ${process.env.BASIC}`,
                'User-Agent': 'MyJYU api'
            }, data
        })
        logger.info({
            message: "Put trimmed ssn to Koha",
            patron: data
        })
    } catch (error) {
        logger.error({
            message: "Error with putting trimmed ssn to Koha",
            patron: data
        })
    }
}

const checkSsn = (candidateData, ssn) => {
    for (const cand of candidateData) {
        const candSsn = (cand.extended_attributes[0].value)
        //poistetaan Kohasta haetusta hetusta mahdolliset välilyönnit ja rivinvaihdot
        const trimmedCandSsn = candSsn.replace(/\s+/g, "")
        if (trimmedCandSsn !== candSsn) {
            putSsn(cand, trimmedCandSsn)
        }
        if (trimmedCandSsn == ssn) {
            return cand
        }
    }
    return
}

const getCandidate = async (ssn, url) => {
    try {
        const candidates = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${process.env.BASIC}`,
                'x-koha-embed': 'extended_attributes',
                'User-Agent': 'MyJYU api'
            }
        })
        const cand = checkSsn(candidates.data, ssn)
        logger.info({
            message: "Checking if ssn matches",
            url: url,
            candidate: `${cand.surname}, ${cand.firstname}`,
            candidatesSsn: cand.extended_attributes[0].value,
            ssnToLookFor: ssn
        })
        if (cand) {
            return cand
        }
    } catch (error) {
    }
    return
}

const getPatron = async (personData) => {

    const ssn = personData.ssn
    let cand = null

    // search by username
    cand = await getCandidate(ssn, encodeURI(`${baseAddress}/patrons/?altcontact_firstname=${personData.username}`))

    if (cand) {
        return cand
    } else {
        // search by date of birth
        const dateOfBirth = getDateOfBirth(ssn)
        cand = await getCandidate(ssn, encodeURI(`${baseAddress}/patrons/?date_of_birth=${dateOfBirth}`))
    }

    if (cand) {
        return cand
    } else {
        // search by name
        const firstname = personData.firstname.split(" ")[0]
        cand = await getCandidate(ssn, encodeURI(`${baseAddress}/patrons/?surname=${personData.surname}&firstname=${firstname}`))
    }

    if (cand) {
        return cand
    } else {
        // search by email
        cand = await getCandidate(ssn, encodeURI(`${baseAddress}/patrons/?email=${personData.email}`))
    }

    if (cand) {
        return cand    
    } else {
        // search by address
        cand = await getCandidate(ssn, encodeURI(`${baseAddress}/patrons/?address=${personData.streetAddress}`))
    }
    return cand    
}

const searchIdp = async (token) => {
    return await axios.get("https://idp.jyu.fi/nidp/oauth/nam/userinfo", {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    })
}

// pin code must be numerical, 4 digits minimum
const validatePins = (pin1, pin2) => {
    if (pin1 != pin2) {
        return false
    }
    const regex = new RegExp("^[0-9]{4,}$")
    return regex.test(pin1)
}

const postNewPin = async (newPin, newPin2, patronId) => {
    await axios({
        method: "post", url: `${baseAddress}/patrons/${patronId}/password`, headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'User-Agent': 'MyJYU api'
        }, data: {
            password: newPin,
            password_2: newPin2
        }
    })
}

const getToken = ctx => {
    const auth = ctx.get('Authorization')
    if (auth.startsWith('Bearer')) {
        return auth.substring(7)
    }
    return
}

const getDateOfBirth = (ssn) => {

    let century = null
    if (ssn[6] == "-") {
        century = "19"
    } else if (ssn[6] == "A") {
        century = "20"
    }
    const year = century + ssn.substr(4,2)
    const month = ssn.substr(2,2)
    const day = ssn.substr(0,2)

    return year + "-" + month + "-" + day
}

module.exports = { getToken, searchIdp, getDateOfBirth, getPatron, checkSsn, postNewPin, validatePins, baseAddress }
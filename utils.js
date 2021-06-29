'use strict'

const axios = require('axios')

const testBaseAddress = "https://koha3-kktest.lib.helsinki.fi/api/v1"
const baseAddress = "https://app1.jyu.koha.csc.fi/api/v1"

// TODO: luetaan tiedostosta
let nextCardnumber = 2500300000

const checkSsn = (candidateData, ssn) => {
    for (const cand of candidateData) {
        const candSsn = (cand.extended_attributes[0].value)
        if (candSsn == ssn) {
            return cand
        }
    }
    return
}

const getPatron = async (personData) => {

    const ssn = personData.ssn

    // search by username
    let candidates = await axios.get(`${baseAddress}/patrons/?altcontact_firstname=${personData.username}`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })
    let cand = checkSsn(candidates.data, ssn)
    if (cand) {
        return cand
    }

    // search by firstname and surname
    const firstname = personData.firstname.split(" ")[0]
    candidates = await axios.get(`${baseAddress}/patrons/?surname=${personData.surname}&firstname=${firstname}`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })
    cand = checkSsn(candidates.data, ssn)
    if (cand) {
        return cand
    }

    // search by email
    candidates = await axios.get(`${baseAddress}/patrons/?email=${personData.email}`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })
    cand = checkSsn(candidates.data, ssn)
    if (cand) {
        return cand
    }

    // search by street adress
    candidates = await axios.get(`${baseAddress}/patrons/?address=${personData.streetAddress}`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })
    cand = checkSsn(candidates.data, ssn)
    if (cand) {
        return cand
    }
    return
}

const searchIdp = async (token) => {
    return await axios.get("https://idp.jyu.fi/nidp/oauth/nam/userinfo", {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    })
}

const postNewPin = async (newPin, newPin2, patronId) => {
    await axios({
        method: "post", url: `${baseAddress}/patrons/${patronId}/password`, headers: {
            'Authorization': `Basic ${process.env.BASIC}`
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
    return null
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

const getNextCardnumber = () => {
    const nextNumber = nextCardnumber
    nextCardnumber++
    return nextNumber
}

module.exports = { getToken, searchIdp, getDateOfBirth, getNextCardnumber, getPatron, checkSsn, postNewPin, baseAddress, testBaseAddress }
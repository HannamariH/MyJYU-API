'use strict'

const axios = require('axios')

// Testi-Kohan osoite
//const baseAddress = "https://koha3-kktest.lib.helsinki.fi/api/v1"
const baseAddress = "https://app1.jyu.koha.csc.fi/api/v1"

const checkSsn = (candidateData, ssn) => {
    for (const cand of candidateData) {
        const candSsn = (cand.extended_attributes[0].value)
        if (candSsn == ssn) {
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
                'x-koha-embed': 'extended_attributes'
            }
        })
        const cand = checkSsn(candidates.data, ssn)
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
    cand = await getCandidate(ssn, `${baseAddress}/patrons/?altcontact_firstname=${personData.username}`)

    if (cand) {
        return cand
    } else {
        // search by name
        const firstname = personData.firstname.split(" ")[0]
        cand = await getCandidate(ssn, `${baseAddress}/patrons/?surname=${personData.surname}&firstname=${firstname}`)
    }

    if (cand) {
        return cand
    } else {
        // search by email
        cand = await getCandidate(ssn, `${baseAddress}/patrons/?email=${personData.email}`)
    }

    if (cand) {
        return cand    
    } else {
        // search by address
        cand = await getCandidate(ssn, `${baseAddress}/patrons/?address=${personData.streetAddress}`)
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

module.exports = { getToken, searchIdp, getDateOfBirth, getPatron, checkSsn, postNewPin, baseAddress }
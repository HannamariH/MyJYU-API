"use strict"

require('dotenv').config()
const Koa = require('koa')
const Router = require('koa-router')
const axios = require('axios')
const bodyParser = require('koa-body')
const openapi = require('koa-openapi')


const app = new Koa()

app.use(bodyParser({
    multipart: true,
    urlencoded: true
}))

const router = new Router()

openapi.initialize({
    apiDoc: fs.readFileSync(path.resolve(__dirname, 'api-doc.yml'), 'utf8'),
    router,
    paths: path.resolve(__dirname, 'api-routes'),
  })
  

const testBaseAddress = "https://koha3-kktest.lib.helsinki.fi/api/v1"
const baseAddress = "https://app1.jyu.koha.csc.fi/api/v1"

// TODO: miten varmistetaan, että uudelleenkäynnistys ei nollaa numeroa?
let nextCardnumber = 2500300000

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

const checkSsn = (candidateData, ssn) => {
    for (cand of candidateData) {
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

const getNextCardbumber = () => {
    const nextNumber = nextCardnumber
    nextCardnumber++
    return nextNumber
}

router.get('/library/card', async ctx => {
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
})

//uuden asiakkaan luominen Kohaan
router.post('/library/card', async ctx => {

    const token = getToken(ctx)
    if (!token) {
        return ctx.status = 401
    }
    const person = await searchIdp(token)

    const categoryCode = category[person.data.roles[0]] + faculties[person.data.faculty_code]

    const cardnumber = getNextCardbumber()

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
            { type: "SSN", value: person.data.ssn },
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
            return ctx.status = 200
        } catch (error) {
            return ctx.status = error.response.status
        }
    }
})


//pin-koodin vaihtaminen
router.post('/library/card/pin', async ctx => {

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
            ctx.response.status = error.response.status
        })
})

app.use(router.routes())

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`running on port ${PORT}`))
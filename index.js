require('dotenv').config()
const Koa = require('koa')
const Router = require('koa-router')
const axios = require('axios')
const bodyParser = require('koa-body')


const app = new Koa()

app.use(bodyParser({
    multipart: true,
    urlencoded: true
}))

const router = new Router()

//TODO: Koha-apin base-osoite käyttöön
//const baseAddress = "https://koha3-kktest.lib.helsinki.fi/api/v1"
const baseAddress = "https://app1.jyu.koha.csc.fi/api/v1/"

let nextCardnumber = 2500300000

// ensin kokeillaan käyttäjätunnuksella (altcontact_firstname), sitten nimi (suku ja eka etunimi?), puh, email, osoite?
const getPatron = async (personData, ssn) => {
    let candidates = []
    
    // search by username
    candidates = await axios.get(`${baseAddress}/patrons/?altcontact_firstname=${personData.username}`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })
    // näköjään tämä ei aiheuta virhettä vaikka candidates.dataa ei olisikaan!
    for (cand of candidates.data) {
        console.log("tutkitaan usernamella haettuja")
        const candSsn = (cand.extended_attributes[0].value)
        console.log(candSsn)
        if (candSsn == ssn) {
            console.log("löytyi usernamella")
            return cand
        } else {
            console.log("ei löytynyt usernamella")
        }
    }

    // search by firstname and surname
    const firstname = personData.firstname.split(" ")[0]
    // TODO: käytä tuotannossa suku + etu -hakua (oma testi vain sukunimellä)
    //candidates = await axios.get(`${baseAddress}/patrons/?surname=${personData.surname}&firstname=${firstname}`, {
    //candidates = await axios.get(`${baseAddress}/patrons/?surname=${personData.surname}`, {    
    candidates = await axios.get(`${baseAddress}/patrons/?surname=iodjdguihudhd`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })

    for (cand of candidates.data) {
        console.log("tutkitaan sukunimellä haettuja")
        const candSsn = (cand.extended_attributes[0].value)
        console.log(candSsn)
        if (candSsn == ssn) {
            return cand
        }
    }

    // search by email
    candidates = await axios.get(`${baseAddress}/patrons/?email=${personData.email}`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })
    for (cand of candidates.data) {
        console.log("tutkitaan emaililla haettuja")
        const candSsn = (cand.extended_attributes[0].value)
        console.log(candSsn)
        if (candSsn == ssn) {
            return cand
        }
    }

    // search by street adress
    candidates = await axios.get(`${baseAddress}/patrons/?email=${personData.streetAddress}`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })
    for (cand of candidates.data) {
        console.log("tutkitaan katuosoitteella haettuja")
        const candSsn = (cand.extended_attributes[0].value)
        console.log(candSsn)
        if (candSsn == ssn) {
            return cand
        }
    }

    // TODO: haku puh.nrolla jos lisätään Library scopeen

}

const searchIdp = async (token) => {
    return await axios.get("https://idp.jyu.fi/nidp/oauth/nam/userinfo", {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    })
}

const postNewPin = async (newPin, newPin2, patronId) => {
    const changedPin = await axios({
        method: "post", url: `${baseAddress}/patrons/${patronId}/password`, headers: {
            'Authorization': `Basic ${process.env.BASIC}`
        }, data: {
            "password": newPin,
            "password_2": newPin2
        }
    })
    console.log(changedPin.config.data)
}

const getToken = ctx => {
    const auth = ctx.get('Authorization')
    if (auth.startsWith('Bearer')) {
        return auth.substring(7)
    } 
    return null
}


router.get('/library/card', async ctx => {
    // asiakastietojen ja sieltä kortin numeron haku (Kohasta)
    const token = getToken(ctx)
    if (!token) {
        // TADAA! TÄMÄ ON OIKEA TAPA PALAUTTAA SAMAN TIEN JATKAMATTA FUNKTIOTA LOPPUUN!!
        return ctx.status = 401
    }
    const person = await searchIdp(token)
    //console.log(person)
    const ssn = person.data.ssn
    const personData = {
        "username": person.data.preferred_username,
        "firstname": person.data.given_name,
        "surname": person.data.family_name,
        "email": person.data.email,
        "streetAddress": person.data.home_street_address,
        "zip": person.data.home_zip_code,
        "city": person.data.home_city
    }
    const patron = await getPatron(personData, ssn)
    //console.log(patron)
    if (!patron) {
        return ctx.status = 404
    }
    ctx.body = {
        "cardnumber": patron.cardnumber
    }
})

//uuden asiakkaan luominen Kohaan
// TODO: mietittävä, mitkä as.tiedot otetaan IDP:stä ja mitkä asiakas saa antaa itse
router.post('/library/card', async ctx => {
    // TODO: tähän tietenkin post requestissa tuleva data + idp:stä haetut tiedot tilalle
    const data = {
        "address": "testikatu 7",
        "city": "jyväskylä",
        "postal_code": "40100",
        "cardnumber": "2500300011",
        "firstname": "otso oliver",
        "surname": "opiskelija",
        "other_name": "opiskelija, otso oliver",
        "email": "otso.opiskelija@jyu.fi",
        "phone": "09876443",
        "date_of_birth": "2000-04-04",
        "category_id": "S",
        "library_id": "CPL",
        "userid": "2500300011",
        "extended_attributes": [
            { "type": "SSN", "value": "050500A1234" },
            { "type": "STAT_CAT", "value": "ES" }
        ],
        "altcontact_firstname": "otolopis"
    }
    console.log("aiotaan postata asiakas")
    // TODO: tämä axios ei toimi, jos asiakas on jo tietokannassa (409?)
    const newPatron = await axios({
        method: "post", url: `${baseAddress}/patrons`, headers: {
            'Authorization': `Basic ${process.env.BASIC}`
        }, data
    })  //TODO: tämä virheenkäsittely ei toimi. (?) Miten päätetään reitin suoritus tähän, jos ei luotu uutta?
    /*.catch((error) => {
        // TODO: onko hyvä lähettää Kohan antama virhekoodi eteenpäin vai laittaa responseen joku oma/omat?
        ctx.response.status = error.response.status
        ctx.body = {
            "error": "error with adding new patron"
        } 
    })*/
    console.log("asiakas postattu")
    console.log(newPatron)
    if (!newPatron.data.patron_id) {
        ctx.response.status = 500
    } else {
        const patronId = newPatron.data.patron_id
        const newPin = ctx.request.body.pin1
        const newPin2 = ctx.request.body.pin2
        const addedPin = await postNewPin(newPin, newPin2, patronId)
        .then((result) => {
            ctx.response.status = 200
        }).catch((error) => {
            // TODO: onko hyvä lähettää Kohan antama virhekoodi eteenpäin vai laittaa responseen joku oma/omat?
            ctx.response.status = error.response.status
            ctx.error.error = "error with adding pin code"
        })
    }
    // TODO: lähetetään myös käyttäjätunnus, tallennetaan johonkin Kohan kenttään ja voidaan myöhemmin hakea sillä
    // TODO: otetaan patron_id talteen, lähetetään sillä pin-koodi perässä `${baseAddress}/patrons/{patron_id}/password`
})


//pin-koodin vaihtaminen
router.post('/library/card/pin', async ctx => {
    // haetaan asiakkaan id (nimellä, puh.nrolla, emaililla?)
    // sitten postataan pin-koodi ko. asiakkaalle
    const newPin = ctx.request.body.pin1
    const newPin2 = ctx.request.body.pin2
    const result = await getPatron()
    // TODO: tähän oikean asiakkaan etsiminen ekan sijaan
    const patronId = result.data[0].patron_id
    console.log(patronId)
    const changedPin = await postNewPin(newPin, newPin2, patronId)
    .then((result) => {
        ctx.response.status = 200
    }).catch((error) => {
        // TODO: onko hyvä lähettää Kohan antama virhekoodi eteenpäin vai laittaa responseen joku oma/omat?
        ctx.response.status = error.response.status
    })
    /*await axios({
        method: "post", url: `${baseAddress}/patrons/${patronId}/password`, headers: {
            'Authorization': `Basic ${process.env.BASIC}`
        }, data: {
            "password": newPin,
            "password_2": newPin2
        }
    }).then((result) => {
        ctx.response.status = 200
    }).catch((error) => {
        // TODO: onko hyvä lähettää Kohan antama virhekoodi eteenpäin vai laittaa responseen joku oma/omat?
        ctx.response.status = error.response.status
    })*/
})

// tätä ei ehkä tarvita? PIN-koodia ei ole mahdollista saada tätä kautta
//olennaisimpien asiakastietojen haku ja palautus MyJYU:un
/*router.get('/library/patron', async ctx => {
    const result = await getPatron()
    console.log(result.data)
    const patron = result.data[0]
    ctx.body = {
        "address": patron.address,
        "cardnumber": patron.cardnumber,
        "city": patron.city,
        "date_of_birth": patron.date_of_birth,
        "email": patron.email,
        "firstname": patron.firstname,
        "mobile": patron.mobile,
        "phone": patron.phone,
        "postal_code": patron.postal_code,
        "surname": patron.surname,
        "userid": patron.userid
    }
})*/

app.use(router.routes())

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on port ${PORT}`));
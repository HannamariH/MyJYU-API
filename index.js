require('dotenv').config()
const Koa = require('koa')
const Router = require('koa-router')
const axios = require('axios')
const bodyParser = require('koa-body')


const app = new Koa()
const router = new Router()

app.use(bodyParser({
    multipart: true,
    urlencoded: true
}))


/*app.use(async ctx => {
  ctx.body = 'Hello World'
})*/

//TODO: Koha-apin base-osoite käyttöön
const baseAddress = "https://koha3-kktest.lib.helsinki.fi/api/v1"


//TODO: fetch from IDP with Bearer token
//SSN of the MyJYu user, fetched from IDP
const usersSsn = "112233-1234"

let nextCardnumber = 2500300000

//TODO: tähän parametreina tiedot, joilla asiakas haetaan!
const getPatron = async () => {
    return await axios.get(`${baseAddress}/patrons/?surname=opiskelija`, {
        headers: {
            'Authorization': `Basic ${process.env.BASIC}`,
            'x-koha-embed': 'extended_attributes'
        }
    })
}

const searchIdp = async () => {
    /*return await axios({method: "post", url: "https://idp.jyu.fi/nidp/oauth/nam/userinfo", data: {}, headers: {
        "Authorization": `Bearer ${token}`
    }})*/
    return await axios.get("https://idp.jyu.fi/nidp/oauth/nam/userinfo", {
        headers: {
            'Authorization': `Bearer ${process.env.TOKEN}`,
        }
    })
}

router.get('/library/card', async ctx => {
    // asiakastietojen ja sieltä kortin numeron haku (Kohasta)
    //jos ja kun synt.ajalla ei voi hakea, haetaan ekaksi nimellä (suku- ja eka etunimi?), sit puh ja email?
    const person = await searchIdp()
    console.log(person.data)
    const result = await getPatron()
    //console.log(result.data)
    let rightPatron = undefined
    for (patron of result.data) {
        console.log(patron.extended_attributes[0].value)
        console.log(usersSsn)
        console.log(patron.extended_attributes[0].value == usersSsn)
        if (patron.extended_attributes[0].value === usersSsn) {
            console.log("löyty")
            rightPatron = patron
            console.log(rightPatron.cardnumber)
            break
        }
    }
    //tämä palauttamaan sen asiakkaan korttinro, jonka hetu tästää usersSsn:n kanssa
    //TODO: muuta kovakoodaus oikeaksi tarkistukseksi
    ctx.body = {
        "cardnumber": rightPatron.cardnumber
    }
})

//uuden asiakkaan luominen Kohaan
router.post('/library/card', async ctx => {
    const newPatron = await axios({ method: "post", url: `${baseAddress}/patrons`, data: {} })
    // TODO: otetaan patron_id talteen, lähetetään sillä pin-koodi perässä `${baseAddress}/patrons/{patron_id}/password`
})

// tätä ei ehkä tarvita? PIN-koodia ei ole mahdollista saada tätä kautta
//olennaisimpien asiakastietojen haku ja palautus MyJYU:un
router.get('/library/patron', async ctx => {
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
})

//pin-koodin vaihtaminen, jos se halutaan?
router.post('/library/card/pin', async ctx => {
    // haetaan asiakkaan id (nimellä, puh.nrolla, emaililla?)
    // sitten postataan pin-koodi ko. asiakkaalle
    const newPin = ctx.request.body.pin1
    const newPin2 = ctx.request.body.pin2
    const result = await getPatron()
    // TODO: tähän oikean asiakkaan etsiminen ekan sijaan
    const patronId = result.data[0].patron_id
    console.log(patronId)
    await axios({
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
        })
})

app.use(router.routes())

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on port ${PORT}`));
const { baseAddress } = require("../utils")
const supertest = require("supertest")
const app = require("../index")
const http = require("http")

const api = supertest(http.createServer(app.callback()))

/* TESTATTAVIA ASIOITA

- korttinumeron haku tokenin kanssa ja ilman
    - kun tietokannassa on ko. asiakas ja kun ei ole
- uuden asiakkaan luonti tokenin kanssa ja ilman
    - vääränlaisella syötteellä
        - kun joku parametri puuttuu
        - ilman bodya
    - kun samalla ssn:llä on jo joku
        - jos luonti onnistuu, lopuksi pitää myös poistaa
- pin-koodin vaihto tokenin kanssa ja ilman
    - kun pin-koodit ei ole samat
    - kun muoto on string
    - ilman bodya


*/

// try routes without token (but correct request body)
describe("request without Bearer token returns 401", () => {
    test('in GET /card', async () => {
        const response = await api.get('/card')
        expect(response.status).toBe(401)
    })
    test('in POST /card', async () => {
        const response = await api.post('/card').send({
            "address" : "Keskikatu 1",
            "postal_code" : "40100",
            "city" : "Jyväskylä",
            "email" : "opiskelija@example.com",
            "phone" : "123456789",
            "pin1" : 1000,
            "pin2" : 1000
        })
        expect(response.status).toBe(401)
    })
    test('in POST /card/pin', async () => {
        const response = await api.post('/card/pin').send({
            "pin1": 9999, 
            "pin2": 9999
        })
        expect(response.status).toBe(401)
    })
})




/*afterAll(async () => {
	await new Promise(resolve => setTimeout(() => resolve(), 500)); // avoid jest open handle error
});*/


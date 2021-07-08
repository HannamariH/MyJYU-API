const { baseAddress } = require("../utils")
const supertest = require("supertest")
const app = require("../index")
const http = require("http")
const { removePatron } = require("../api-routes/card/{patron_id}")
const fs = require('fs')

const api = supertest(http.createServer(app.callback()))


let cardnumber = null
// lue cardnumber.login numero talteen
beforeAll(() => {
    try {
        cardnumber = fs.readFileSync("logs/cardnumber.log", "utf8")
        console.log(cardnumber)
    } catch (error) {
        console.log(error)
        console.log("couldn't read cardnumber.log")
    }
})

// useat testit vaativat toimiakseen IDP:ltä haetun henk. koht. tokenin!
const token = ""

// try routes without token (but correct request body)
describe("request without Bearer token returns 401", () => {
    test('in GET /card', async () => {
        const response = await api.get('/card')
        expect(response.status).toBe(401)
    })
    test('in POST /card', async () => {
        const response = await api.post('/card').send({
            "address": "Keskikatu 1",
            "postal_code": "40100",
            "city": "Jyväskylä",
            "email": "opiskelija@example.com",
            "phone": "123456789",
            "pin1": "1000",
            "pin2": "1000"
        })
        expect(response.status).toBe(401)
    })
    test('in POST /card/pin', async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "9999",
            "pin2": "9999"
        })
        expect(response.status).toBe(401)
    })
})


describe("when patron doesn't have a library card", () => {
    test("GET /card returns 404", async () => {
        await api.get('/card').set("Authorization", `Bearer ${token}`)
            .expect(404)
    })
    test("posting new pin code returns 404", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "1234",
            "pin2": "1234"
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(404)
    })
})


let patron_id = null

// tests expect that person with token doesn't have a library card already!
describe("post new patron", () => {
    test("with no body returns 400", async () => {
        await api.post('/card').send({}).set("Authorization", `Bearer ${token}`)
        .expect(400)
    })
    test("when body doesn't have required fields returns 400", async () => {
        await api.post('/card').send({
            "address": "Keskikatu 1",
            "postal_code": "40100",
            "city": "Jyväskylä",
            "email": "opiskelija@example.com"
        }).set("Authorization", `Bearer ${token}`)
        .expect(400)
    })
    test("with right body and token succeeds", async () => {
        const response = await api.post('/card').send({
            "address": "Keskikatu 1",
            "postal_code": "40100",
            "city": "Jyväskylä",
            "email": "opiskelija@example.com",
            "phone": "123456789",
            "pin1": "1000",
            "pin2": "1000"
        }).set("Authorization", `Bearer ${token}`)
        .expect(201)
        .expect('Content-Type', /application\/json/)
        expect(response.body.cardnumber).toBeDefined()
        expect(response.body.patron_id).toBeDefined()
    
        patron_id = response.body.patron_id
        console.log("patron_id: " + patron_id)
    })
    test("when the same ssn is aleady in use returns 409", async () => {
        await api.post('/card').send({
            "address": "Keskikatu 1",
            "postal_code": "40100",
            "city": "Jyväskylä",
            "email": "opiskelija@example.com",
            "phone": "123456789",
            "pin1": "1000",
            "pin2": "1000"
        }).set("Authorization", `Bearer ${token}`)
        .expect(409)
    })
})


describe("when person has a library card", () => {
    test("GET /card with token returns 200 and cardnumber", async () => {
        const response = await api.get('/card').set("Authorization", `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
        expect(response.body.cardnumber).toBeDefined()
    })
})


describe("posting new pin code", () => {
    test("pin codes matching the specs return 200", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "1234",
            "pin2": "1234"
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(200)
    })
    test("alphabetic characters return 400", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "foobar",
            "pin2": "foobar"
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("less than 4 digits return 400", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "123",
            "pin2": "123"
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("unmatching pins return 400", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "1234",
            "pin2": "1235"
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("integer pins return 400", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": 1234,
            "pin2": 1234
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("only one pin returns 400", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": 1234
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("no body returns 400", async () => {
        const response = await api.post('/card/pin').send({}).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })

})


describe("finally", () => {
    test("added patron is removed", async () => {
        const removed = await removePatron(patron_id)
        expect(removed).toBe(204)
    })
})

// writes original cardnumber back to cardnumber.log
afterAll(() => {
    try {
        fs.writeFileSync("logs/cardnumber.log", cardnumber.toString())
    } catch (error) {
        console.log(error)
        console.log("couldn't write to cardnumber.log")
    }
})


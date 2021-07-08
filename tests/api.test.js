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

*/

// useat testit vaativat toimiakseen IDP:ltä haetun henk. koht. tokenin!
const token = "eyJhbGciOiJBMTI4S1ciLCJlbmMiOiJBMTI4R0NNIiwidHlwIjoiSldUIiwiY3R5IjoiSldUIiwiemlwIjoiREVGIiwia2lkIjoiNyJ9.DfkQuTsxfFckmJur6S78pm_EyOtokGZx.uW1DGntlOg_P2bqE.AQTHEaQ7pUZKJpIvNtFJY1ujj_Z82uhJ8W97-SrKDkrdx8AcThlTxnre_aenf5m3xuNMIMMXVnvATDRYwySNvK7SQHWK7Wj7TUXB_rDAZmDUoNVb_BoQq2Yx2cNxrU_3-boQrjWOavcieodWxNs36_NQVqi_9lWYi66kAcxdN_EDX3npIOIHtKrAds8hSOPSkLeW6hWU-7l-fXAUtX3_CKNpIp2i4bzZ9PWVK-dhQEnPPz0pSK-29W2xMOra42YEiwjMOnJ_L1vkX0KtUl-oFwKCA0xSGN284kw8Mi2z38bpKMrWDo33rPbTwCQZQ-qu0io8jw4zNg-R_kLE-PE2fXkmFfbPALQiqgwJ00H8TPGe8bLSvVInoZeIg408X9N3pcknAfTNAqMTUbhIm1sSkOLt5x4HxNu9CSi8kUpqZfsm5eDXzi-3KK4z4eRiX0EF_jVHlqhDEvxQ3BlFYmen9YGix0oXnn0a7Aet-UpPCETCdocMFcdh5VXpkBmb9QRwZYpNQ6b-3pZnfLn9kOY0_wZTmeNfXhvRmB5KZuYvEEy2jH3e8sfSGHM3KRskIRU17RTxRFqYJMoljEhzYoVcFgReVfa_5q7M5LBPtA7gWXBrpza_CGGDtMbfxwSfjW6G_-Q3zBbS8YD3s8RAO30J6IGsSjY83Vlz4v4L079ZIF5oDanx1Uu6FnaC_y5fujDuKwczZ_5vK893TWln2eQEc0R6z_VEgPkwJCjGMyIQ8dJOIEtD2fBf_m4-VqJGWdf_z8gBQ8TomFrgGyTPZVQXYSJsJRjVQ2YjtkMZh82E1CcGFiTXxWeQxS1TisZ4ScoBmu8WGoyEQtkGGYm512anLPBNHR4JO_ALdYAwcbdmzQ0oHE3FxY3pQ4anU6NRBUlsCATnLxsEUAFEzwE7BVj6zvE1TT4vGXXh2VJA39MAHPMeJ-caC8hjiMSecjYJQEw40DXVipUI9PKH5e8WbPpW0rDivTq4XnPxSUVvsIrHP07U7XFjZnTu282MKqlHrLYTvXoP0R78WERCQC7p_L8Q7DRGROScxiKQaYQwSTLzm6bKc597pPYxu3HW_SpnWDILesHI2xXQGuskGM51GGt51MzDt3WgzhyQMw6W2M1HAZbQTrwh9QHSkVZNZX8caCV1tkHYReGNqCp5JYMBoIFveo-lktjtYyH2xws7lVQJxWIvEUwIWNDjcsGxRFHdtd2vbtt8U6p4-DBJkZGNlp4LFQv0trqKU8thbmpsJdePTfCZoBH_sTgNHqug1UDIZGF7-WCb4cAODoBHREYJp4Gj-Ge5RKDX6xqdnw__A7Cm1BvCqSBNNygEqFJWqsjcThrOUI2-fIWGV5AQaL40Bgj04YbrUD55T3_lkDVnH6rkFuPjdXwp5o5dFWn17yVJXieQEBTcwPnHxOfGRLxRmj_7T7X810gzL6Oxk5EWh3D3kuExCcllgH0yX-hzfSpVpewF0aBSTKZXmXlz5KDTu5y8iGeS5PJA6Tzt6uzPEIb9pYMxlQ7sOCO6mFzPw3hrQJ4wAZzjXUFAcW2qu4MhAkWIjWkUBgXvHOURARdOrLm6bAQQXVp2XOdYJZvhIuwtmaduEAmubj5hlV8omdwRxtU1PfHBO_g63smJQHUXQq7byfBQSuzysPm_PcFZ7sk.ALXM1eQm4NjCd0SHQMjr0Q"

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


describe("wrong pin codes return 400", () => {
    test("alphabetic characters", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "foobar",
            "pin2": "foobar"
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("less than 4 digits", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "123",
            "pin2": "123"
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("unmatching pins", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": "1234",
            "pin2": "1235"
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("integer pins", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": 1234,
            "pin2": 1234
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("only one pin", async () => {
        const response = await api.post('/card/pin').send({
            "pin1": 1234
        }).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })
    test("no body", async () => {
        const response = await api.post('/card/pin').send({}).set("Authorization", `Bearer ${token}`)
        expect(response.status).toBe(400)
    })

})


test("pin codes matching the specs return 200", async () => {
    const response = await api.post('/card/pin').send({
        "pin1": "1234",
        "pin2": "1234"
    }).set("Authorization", `Bearer ${token}`)
    expect(response.status).toBe(200)
})


// when person with token already has a library card
test("GET /card with token returns 200 and cardnumber", async () => {
    const response = await api.get('/card').set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    expect(response.body.cardnumber).toBeDefined()
})








/*afterAll(async () => {
    await new Promise(resolve => setTimeout(() => resolve(), 500)); // avoid jest open handle error
});*/


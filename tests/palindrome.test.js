const { baseAddress } = require("../utils")
const supertest = require("supertest")
const app = require("../index")

const api = supertest(app)

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

//--------------nämä myöhemmin pois-------------------

const palindrome = (string) => {
    return string
        .split('')
        .reverse()
        .join('')
}

describe("palindrome of", () => {
    test("a", () => {
        const result = palindrome("a")
        expect(result).toBe("a")
    })
    
    test("kissa", () => {
        const result = palindrome("kissa")
        expect(result).toBe("assik")
    })
})


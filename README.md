# MyJYU API
Rajapinta MyJYU-sovelluksen mobiilikirjastokorttia varten. Sisältää openapi-dokumentaation. Käyttää kirjastojärjestelmä Kohan REST APIa, josta etsii olemassa olevan asiakkaan kirjastokortin numeron tai lisää uuden asiakkaan. Mahdollistaa myös asiakkaan pin-koodin vaihdon. Oikea asiakas haetaan JYU:n IDP:stä pyynnön mukana tulevan access tokenin avulla ja yhdistetään henkilötunnuksen perusteella oikeaan asiakkaaseen Kohassa.
## Api docs
https://tools.oscapps.jyu.fi/myjyu-api/api-docs
## Testaus
Testausta varten api.test.js-tiedostoon on lisättävä access token muuttujan `const token` arvoksi. Testihenkilöllä (hetu) ei saa olla ennestään kirjastokorttia tietokannassa.
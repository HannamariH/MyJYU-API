# MyJYU API

Rajapinta MyJYU-sovelluksen mobiilikirjastokorttia varten. Sisältää openapi-dokumentaation. Käyttää Kohan REST APIa, josta etsii olemassa olevan asiakkaan kirjastokortin numeron tai lisää uuden asiakkaan. Mahdollistaa myös asiakkaan pin-koodin vaihdon. Oikea asiakas haetaan IDP:stä pyynnön mukana tulevan Bearer tokenin avulla ja yhdistetään henkilötunnuksen perusteella oikeaan asiakkaaseen Kohassa.
Rajapinta on osoitteessa https://tools.oscapps.jyu.fi/myjyu-api. Kohan testikantaa käyttävä testiversio: https://tools.oscapps.jyu.fi/myjyu-api-test.

Uusille asiakkaille annetaan kirjastokortin numeroita alkaen numerosta 2500300000. Viimeksi käytetty numero kirjoitetaan logs/cardnumber.log-tiedostoon. Docker volumen käytöllä edellinen numero pysyy tallessa vaikka kontti käynnistettäisiinkin uudelleen.

{patron_id}.js tarjoaa delete-reitin, jolla voi poistaa asiakkaan tietokannnasta. Tämä on vain kehitystä ja testausta varten, tuotantoversiossa tämä ei saa olla käytössä!

## Api docs
https://tools.oscapps.jyu.fi/myjyu-api/api-docs

https://tools.oscapps.jyu.fi/myjyu-api-test/api-docs

## Testaus
Testausta varten api.test.js-tiedostoon on lisättävä access token muuttujan `const token` arvoksi. Testihenkilöllä (hetu) ei saa olla ennestään kirjastokorttia tietokannassa.
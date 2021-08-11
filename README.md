# MyJYU API

Rajapinta MyJYU-sovelluksen mobiilikirjastokorttia varten. Sisältää openapi-dokumentaation. Käyttää Kohan REST APIa, josta etsii olemassa olevan asiakkaan kirjastokortin numeron tai lisää uuden asiakkaan. Mahdollistaa myös asiakkaan pin-koodin vaihdon. Oikea asiakas haetaan IDP:stä pyynnön mukana tulevan Bearer tokenin avulla ja yhdistetään henkilötunnuksen perusteella oikeaan asiakkaaseen Kohassa.
Rajapinta on osoitteessa https://tools.oscapps.jyu.fi/myjyu-api.

Uusille asiakkaille annetaan kirjastokortin numeroita alkaen numerosta 2500300000. Viimeksi käytetty numero kirjoitetaan cardnumber.log-tiedostoon. Kun apia päivitetään ja kontti käynnistetään uudelleen, on huolehdittava korttinumeroiden jatkuvuudesta!

{patron_id}.js tarjoaa delete-reitin, jolla voi poistaa asiakkaan tietokannnasta. Tämä on vain kehitystä ja testausta varten, tuotantoversiossa tämä ei saa olla käytössä!

## Api docs
https://tools.oscapps.jyu.fi/myjyu-api/api-docs
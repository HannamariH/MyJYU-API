# MyJYU API

Rajapinta MyJYU-sovelluksen mobiilikirjastokorttia varten. Sisältää openapi-dokumentaation. Käyttää Kohan REST APIa, josta etsii olemassa olevan asiakkaan kirjastokortin numeron tai lisää uuden asiakkaan. Mahdollistaa myös asiakkaan pin-koodin vaihdon. Oikea asiakas haetaan IDP:stä pyynnön mukana tulevan Bearer tokenin avulla ja yhdistetään henkilötunnuksen perusteella oikeaan asiakkaaseen Kohassa.
Rajapinta on osoitteessa https://tools.oscapps.jyu.fi/myjyu-api.

## Api docs
https://tools.oscapps.jyu.fi/myjyu-api/api-docs
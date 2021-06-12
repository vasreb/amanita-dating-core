const fetch = require('node-fetch');

var url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
var token = "a5d4efeddd9a42b1d77e51369471b364c0c7de2a";
var query = "москва хабар";

var options = {
    method: "POST",
    mode: "cors",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Token " + token
    },
    body: JSON.stringify({query: query})
}

fetch(url, options)
.then(response => response.text())
.then(result => console.log(result))
.catch(error => console.log("error", error));
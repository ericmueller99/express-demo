const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const {DetailedError} = require("./DetailedError");

class User {

    #bearerToken;

    constructor(bearerToken = '') {
        if (bearerToken) this.#bearerToken = bearerToken;
    }

    set bearerToken(bearerToken) {
        this.#bearerToken = bearerToken;
    }

    get bearerToken() {
        return this.#bearerToken;
    }

    createBearerToken(tokenPayload, tokenType = 'api') {

        const privateKey = fs.readFileSync(path.join(__dirname, "../certs/private.key"));
        if (privateKey) {
            let payload = {
                tokenType,
                exp: Math.floor(Date.now() / 1000 + (60 * 60)),
                ...tokenPayload
            }
            this.#bearerToken = jwt.sign(payload, privateKesy, {algorithm: "RS256", issuer: "express-demo"});
        }
        else {
            let error = new DetailedError("jwt_secret is not set", 400, true, true);
            throw error;
        }
    }

}

module.exports = {User};

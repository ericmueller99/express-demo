const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const {DetailedError} = require("./DetailedError");

class User {

    //private fields so they cannot be modified outside of the class without methods.
    #bearerToken;
    #bearerTokenExpiration = Math.floor(Date.now() / 1000 + (60 * 60))
    #validToken = false;
    #data = {
        username: null,
        validFor: []
    }

    constructor(bearerToken = '') {
        if (bearerToken) this.#bearerToken = bearerToken;
    }

    set bearerToken(bearerToken) {
        this.#bearerToken = bearerToken;
    }

    get bearerToken() {
        return this.#bearerToken;
    }

    get data() {
        return this.#data;
    }
    get isValidToken() {
        return this.#validToken;
    }

    //create a new bearer token.  Default time is 60 minutes and token type is api.  For tic-tac-toe a type of tic-tac-toe should be sent.
    createBearerToken(tokenPayload, tokenType = 'api') {

        const privateKey = fs.readFileSync(path.join(__dirname, "../certs/private.key"));
        if (privateKey) {
            let payload = {
                data: {
                    validFor: [tokenType],
                    ...tokenPayload
                },
                exp: this.#bearerTokenExpiration,
            }
            this.#bearerToken = jwt.sign(payload, privateKey, {algorithm: "RS256", issuer: "express-demo"});
        }
        else {
            throw new DetailedError("jwt_secret is not set", 400, true, true);
        }
    }

    #resetValidityState() {
        this.#validToken = false;
        this.#data = {
            username: null,
            validFor: []
        }
    }

    //validate a token.  I made this async so we could do potentially do some database calls in here.
    async validateToken() {

        const publicKey = fs.readFileSync(path.join(__dirname, "../certs/public.key"));

        //if there is no token set then make sure the user state is invalid.
        if (!this.#bearerToken) {
            this.#resetValidityState();
            throw new DetailedError("there is no bearerToken");
        }

        if (publicKey) {
            try {
                const decoded = jwt.verify(this.#bearerToken, publicKey, {algorithm: "RS256", "issuer": "express-demo", expiresIn: "1h"});
                //here if we really wanted to get crazy we could check the db to makes sure it matches
                this.#validToken = true;
                this.#data = decoded.data;
            }
            catch (error) {
                throw new DetailedError(error.message, 401);
            }
        }
        else {
            throw new DetailedError("jwt public is not set", 400, true, true);
        }

    }

}

module.exports = {User};

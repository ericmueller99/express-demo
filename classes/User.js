class User {

    #bearerToken;

    constructor(bearerToken = '') {
        if (bearerToken) this.#bearerToken = bearerToken;
    }

    set bearerToken(bearerToken) {
        this.#bearerToken = bearerToken;
    }

}

module.exports = {User};

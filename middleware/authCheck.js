const { DetailedError } = require('../classes/DetailedError');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const {User} = require('../classes/User');

//paths that do not require authentication.  Probably a better idea to put this in some kind of configuration file.
const authFreePaths = new Set(['/authenticate']);

//checks for a bearer token on every request and sends an error back to the client if auth is required but no present.
const validateBearerToken = (req, res, next) => {

    //check if this is a endpoint that requires a bearer token
    const {path: requestPath} = req;
    if (authFreePaths.has(requestPath)) {
        next();
        return;
    }

    //getting the bearer token
    let {Authorization: bearerToken} = req.headers;
    if (!bearerToken) {
        //try without destructuring just to make sure.
        bearerToken = req.headers.Authorization || req.headers.authorization;
    }
    if (!bearerToken) {
        next(new DetailedError('You are not authorized', 401));
        return;
    }

    //verifying the bearer token.
    bearerToken = bearerToken.replace("Bearer ", "").replace("bearer ", "");

    const user = new User(bearerToken);
    user.validateToken()
        .then(() => {
            if (user.info && user.isValidToken) {
                req.user = user.info;
                req.isValid = user.isValidToken;
                req.bearerToken = user.bearerToken;
                next();
            }
            else {
                throw new DetailedError("There was an error validating the token", 500, true, true);
            }
        })
        .catch(error => next(error));

}

module.exports = {
    validateBearerToken
}

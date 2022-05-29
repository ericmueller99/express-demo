const { DetailedError } = require('../classes/DetailedError');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

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

    const publicKey = fs.readFileSync(path.join(__dirname, '../certs/public.key'), 'utf8');
    jwt.verify(bearerToken, publicKey, [], (error, decodedToken)=> {
        if (error) {
            next(new DetailedError("You are not authorized", 401))
            return;
        }

        console.log(decodedToken);

    })

}

module.exports = {
    validateBearerToken
}

const express = require('express');
const {DetailedError} = require("../classes/DetailedError");
const router = express.Router();
const {User} = require('../classes/User');

router.get("/", (req,res,next) => {

    //we would obviously authenticate these credentials or anything else passed before authentcating and creating a bearer token, but for this demo i am just focusing on a tic-tac-toe game.
    const user = new User();
    const {type, username, password} = req?.body;
    if (type === 'tic-tac-toe' && username) {
        user.createBearerToken({username}, "tic-tac-toe");
        res.json({
            result: true,
            expiration: 60,
            access_token: user.bearerToken
        })
    }
    else if (username && password) {
        res.json({
            result: true,
            message: "this login is not supported yet"
        })
    }
    else {
        next(new DetailedError("type must = tic-tac-toe and username must not be blank or username and password are required"));
    }

})

module.exports = router;

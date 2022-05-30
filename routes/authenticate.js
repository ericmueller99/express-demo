const express = require('express');
const {DetailedError} = require("../classes/DetailedError");
const router = express.Router();
const {User} = require('../classes/User');

router.get("/", (req,res,next) => {

    if (!req.body.client_secret || (req.body.client_id)) {
        next(new DetailedError("client_secret and client_id are required fields"));
        return;
    }

    const user = new User();
    try {
        user.createBearerToken()
        res.json({
            result: true,
            expiration: 60,
            access_token: user.bearerToken
        })
    }
    catch (error) {
        console.log(error);
        next(error);
    }



})

module.exports = router;

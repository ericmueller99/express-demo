const express = require('express');
const {DetailedError} = require("../classes/DetailedError");
const router = express.Router();

router.get("/", (req,res,next) => {

    if (!req.body.client_secret || (req.body.client_id)) {
        next(new DetailedError("client_secret and client_id are required fields"));
        return;
    }

    console.log("hello");

})

module.exports = router;

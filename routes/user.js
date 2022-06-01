const express = require('express');
const router = express.Router();
const {wsServer} = require('./tic-tac-toe-game');

//return information about the logger in user.
router.get("/", (req,res,next) => {

    console.log("new request for user get endpoint");

    wsServer.emit("test");

    res.json({
        result: true
    })

})

module.exports = router;

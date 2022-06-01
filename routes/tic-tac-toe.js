const express = require('express');
const router = express.Router();
const {wsServer} = require('./tic-tac-toe-game');
const {DetailedError} = require("../classes/DetailedError");

router.get('/create', (req,res,next) => {

    const {gameState} = req?.body;
    const players = req?.body?.players;

    if (gameState && players.length === 2) {

        //when the game is created return the data to the client
        const gameCreated = (gameData) => {
            console.log("game-created");
            res.json("test")
        }

        //calling the create-game emit.
        wsServer.emit('create-game', {
            id: "",
            players,
            gameCreated
        });

    }
    else {
        next(new DetailedError("gameState and players array is required", 400));
    }

})

module.exports = router;

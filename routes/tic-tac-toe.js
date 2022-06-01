const express = require('express');
const router = express.Router();
const {wsServer} = require('./tic-tac-toe-game');
const {DetailedError} = require("../classes/DetailedError");

//when someone joins your game they use this create endpoint.  the game is created and both clients are notified via the websocket.
router.get('/create', (req,res,next) => {

    const players = req?.body?.players;
    if (players.length === 2) {

        //when the game is created return the data to the client
        const gameCreated = (error, gameData) => {
            if (error) {
                next(error);
            }
            else {

                //sending a new update to both of the players via websockets to alert their connection the game has started.
                wsServer.emit('game-created', gameData);

                res.json({
                    gameId: gameData.gameId,
                    data: gameData.data
                });
            }
        }

        //calling the create-game emit.
        wsServer.emit('create-game', {
            players,
            gameCreated
        });

    }
    else {
        next(new DetailedError("gameState and players array is required", 400));
    }

})

module.exports = router;

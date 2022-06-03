const {parse} = require('url');
const qs = require('node:querystring');
const ws = require('ws');
const wsServer = new ws.Server({
    noServer: true
});
const {User} = require('../classes/User');
const {Game} = require('../classes/Game');
const {DetailedError} = require("../classes/DetailedError");

function webSockets(expressServer) {

    const user = new User();

    //creating the websocket for the tic-tac-toe game.  Verifying that the user has a correct jwt token for the game.
    expressServer.on("upgrade", (req, socket, head) => {

        //reject the connection
        const rejectConnection = (reason) => {
            console.log(reason);
            socket.write(`HTTP/1.1 401 Invalid request.  ${reason}`);
            socket.destroy();
        }

        try {
            const {pathname: pathName, query} = parse(req.url);
            const queryStrings = qs.parse(query);

            let availablePaths = new Set(['/tic-tac-toe/play', '/tic-tac-toe/lobby']);
            if (availablePaths.has(pathName)) {

                //authenticating the access token
                user.bearerToken = queryStrings?.access_token;
                user.validateToken()
                    .then(() => {
                        if (user.isValidToken && user.bearerToken) {
                            wsServer.handleUpgrade(req, socket, head, (ws) => {
                                ws.id = user.bearerToken;
                                ws.username = user.data.username;
                                wsServer.emit('connection', ws, req);
                            })
                        }
                        else {
                            rejectConnection('access_token is in valid');
                        }
                    })
                    .catch(error =>{
                        rejectConnection(error.message);
                    })

            }
            else {
                rejectConnection('invalid websocket address');
            }

        }
        catch (error) {
            rejectConnection('access code is missing or cannot be parsed.  Make sure you have a ?access_code={access_code}');
        }

    })

    //connection default emitter.
    wsServer.on("connection", (connection, connectionRequest) => {

        const [_path, params] = connectionRequest?.url?.split('?');

        //a new message has arrived from a client.  We are basing states on a message received.  Example the user enters the lobby when we get a current state of {currentState:"lobby"}
        connection.on("message", (message, isBinary) => {


            //converting the message to json
            let messageJson;
            try {
                const buff = Buffer.from(message);
                messageJson = JSON.parse(buff.toString());
            }
            catch (e) {
                connection.send(JSON.stringify({result: false, errorMessage: "invalid JSON"}));
            }

            const {currentState, actionType, gameId} = messageJson;
            const gameState = messageJson?.gameState
            connection.currentState = currentState;

            if (currentState === 'lobby') {
                handleLobby(connection);
            }
            else if (currentState === 'game' && actionType === 'updateGame') {
                //getting the game from the db to make sure this is a valid game & its this players turn
                const game = new Game(gameId);
                game.getGame()
                    .then(() => {
                        if (connection.username !== game.data.nextPlayer) {
                            throw new DetailedError('nextPlayer is not correct');
                        }
                    })
                    .then(() => game.updateGame(gameState))
                    .then(() => {
                        handleGameUpdate(game);
                    })
                    .catch(error => {
                        connection.send(JSON.stringify({
                            result: false,
                            errorMessage: error.message
                        }))
                    })
            }
            else if (currentState === 'startGame') {
                handleLobby(connection);
            }
            else {
                connection.send(JSON.stringify({result: false, errorMessage: "Not a valid gameState"}))
            }

        })

        //handle lobby response
        const handleLobby = (connection) => {

            //every single time someone joins a lobby its going to push out to every connected client the lobby count.  To fix this i would have to store the current state of the lobby somewhere and see if it actually changed

            let lobbyUsers = [];
            let availableGames = [];
            wsServer.clients.forEach(c => {
                if (c.currentState === 'lobby' || c.currentState === 'startGame') {
                    lobbyUsers.push(c.username);
                }
                if (c.currentState === 'startGame') {
                    availableGames.push(c.username);
                }
            });

            //there is likely a better way to do this so i dont have to loop through twice, but for now this works
            wsServer.clients.forEach(client => {
                if (client.currentState === 'lobby' || client.currentState === 'startGame') {
                    client.send(JSON.stringify({
                        result: true,
                        lobbyUsers,
                        availableGames
                    }))
                }
            })

        }

        //handles the response to game update.
        const handleGameUpdate = (updatedGame) => {
            const players = new Set(updatedGame.data.players);
            wsServer.clients.forEach(client => {
                if (players.has(client.username)) {
                    client.send(JSON.stringify({
                        result: true,
                        ...updatedGame.data
                    }))
                }
            })
        }

    })

    //creates a tic tac toe game and sends it to both players
    wsServer.on("create-game", (gameData) => {

        //making sure that each user in the game is a valid web sockets user
        let foundUsers = [];
        wsServer.clients.forEach(client => {
            if (gameData.players.includes(client.username)) {
                foundUsers.push(client.username)
            }
        })
        if (foundUsers.length === 2) {

            const game = new Game();
            game.createGame(gameData.players)
                .then(() => {
                    gameData.gameCreated(null, game);
                })
                .catch(error => {
                    gameData.gameCreated(error);
                })
        }
        else {
            gameData.gameCreated(new DetailedError(`Online player count is not two.  Online players found: ${foundUsers.toString()}`))
        }

    })

    //new game has been created.  Send a websocket message to each player so that their screens can refresh with the new game.
    wsServer.on("game-created", (gameData) => {
        wsServer.clients.forEach(client => {
            if (gameData.data.players.includes(client.username)) {
                client.send(JSON.stringify(gameData.data));
            }
        })
    })

}

module.exports = {
    wsServer,
    webSockets
}

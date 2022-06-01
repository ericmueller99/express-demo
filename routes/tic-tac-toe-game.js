const {parse} = require('url');
const qs = require('node:querystring');
const ws = require('ws');
const wsServer = new ws.Server({
    noServer: true
});
const {User} = require('../classes/User');

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

            let availablePaths = new Set(['/tic-tac-toe/play', 'tic-tac-toe/lobby']);
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

            const {currentState} = messageJson;
            if (currentState === 'lobby') {
                handleLobby(connection);
            }
            else if (currentState === 'create-game') {

            }
            else if (currentState === 'game') {
                //object will look like this:
                // {
                //     "currentState":"game",
                //     "gameId":"12345",
                //     "players": ["Silentexpanse", "Expanse"],
                //     "gameState": ["x", "o", "x", "o", null, null, "x", null, null],
                //     "nextPlayer": "Silentexpanse"
                // }
            }
            else {
                connection.send(JSON.stringify({result: false, errorMessage: "Not a valid gameState"}))
            }

        })

        //handle lobby response
        const handleLobby = (connection) => {

            let lobbyUsers = [];
            wsServer.clients.forEach(c => lobbyUsers.push(c.username));
            const {username} = connection;
            lobbyUsers = lobbyUsers.filter(e =>  username !== e);

            connection.send(JSON.stringify({
                result: true,
                lobbyUsers: lobbyUsers
            }))
        }

        //handle game response
        const handleGame = (connection) => {

        }

    })

    //creates a tic tac toe game and sends it to both players
    wsServer.on("create-game", (gameData, callback) => {


        //here i would check that each of the users mentioned in the game is a valid web socket user.  create the game on cosmosdb, and then return the initial state of the game in the game object.

        gameData.gameCreated(gameData);

    })



}

module.exports = {
    wsServer,
    webSockets
}

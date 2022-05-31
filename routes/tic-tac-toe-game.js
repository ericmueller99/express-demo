const {parse} = require('url');
const qs = require('node:querystring');
const ws = require('ws');
const wsServer = new ws.Server({
    noServer: true
});
const {DetailedError} = require('../classes/DetailedError');
const {User} = require('../classes/User');

function webSockets(expressServer) {

    //creating the websocket for the tic-tac-toe game.  Verifying that the user has a correct jwt token for the game.
    expressServer.on("upgrade", (req, socket, head) => {

        try {
            const {pathname: pathName, query} = parse(req.url);
            const queryStrings = qs.parse(query);
            if (pathName === '/tic-tac-toe/play' && queryStrings.access_token) {

                const user = new User(queryStrings.access_token);
                //TODO validate the user here.  Need to also look at the key type.  need to add a tic-tac-toe key time to authenticate.


            }
            else {
                socket.write('HTTP/1.1 404 Invalid Websocket address and/or missing access_token.');
                socket.destroy();
            }

        }
        catch (error) {
            socket.write('HTTP/1.1 401 Invalid request.  access_code is missing.');
            socket.destroy();
        }

        wsServer.handleUpgrade(req, socket, head, (webSocket) => {

            // wsServer.emit('connection', webSocket, req);
        })
    })

    wsServer.on("connection", (connection, connectionRequest)=> {
        const [_path, params] = connectionRequest?.url?.split('?');
        console.log(_path, params);
        connection.on("message", (message) => {

            console.log("Hello");

            console.log(message);
            connection.send("Hello");
        })
    })


}

module.exports = webSockets;

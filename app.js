const express = require('express');
const app = express();
require("dotenv").config();
const bodyParser = require('body-parser');
const {validateBearerToken: authCheck} = require('./middleware/authCheck');
const {DetailedError} = require('./classes/DetailedError');
const ws = require('ws');

app.use(bodyParser.json());

//authentication check.
app.use(authCheck);

process.on('uncaughtException', (error, req, res) => {
    console.log(error);
})

//routes
const authentication = require('./routes/authenticate');
app.use('/authenticate', authentication);

//error handling
app.use((error, req, res, next) => {
    if (error) {
        if (error instanceof DetailedError) {
            res.status(error.statusCode).json(error);
            if (error.throwError) {
                throw error;
            }
        }
        else {
            //a error happened that was not instance of Detailed Error and not handled properly.
            //here I would create a detailed error for logging and other notifications

            res.status(400);
            res.json({result:false, errorMessage: "There was a unhandled server error"});
        }
    }
})

//start the app
const port = 3000 || process.env.PORT;
const server = app.listen(port, () => {
    console.log("app.js started");
});


const wsServer = new ws.Server({
    noServer: true
});
server.on("upgrade", (req, socket, head) => {
    wsServer.handleUpgrade(req, socket, head, (webSocket) => {
        wsServer.emit('connection', webSocket, req);
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


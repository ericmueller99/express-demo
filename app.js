const express = require('express');
const app = express();
require("dotenv").config();
const bodyParser = require('body-parser');
const {validateBearerToken: authCheck} = require('./middleware/authCheck');
const {DetailedError} = require('./classes/DetailedError');
const webSockets = require('./routes/tic-tac-toe-game');

app.use(bodyParser.json());

//authentication check.
app.use(authCheck);

process.on('uncaughtException', (error, req, res) => {
    console.log(error);
})

//routes
const authenticationRoutes = require('./routes/authenticate');
const userRoutes = require('./routes/user');
const ticTacToeRoutes = require('./routes/tic-tac-toe');
app.use('/authenticate', authenticationRoutes);
app.use('/user', userRoutes);
app.use('/tic-tac-toe', ticTacToeRoutes);

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

            console.log(error);

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

webSockets(server);

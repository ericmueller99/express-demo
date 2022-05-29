const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {validateBearerToken: authCheck} = require('./middleware/authCheck');
const {DetailedError} = require('./classes/DetailedError');

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
            if (!error.statusCode) {
                console.log("No status code was set in the error.  Defaulting to 400");
                error.statusCode = 400;
            }
            res.status(error.statusCode).json(error);
        }
        else {
            console.log(error);
        }
    }
})

//start the app
app.listen(3000, () => {
    console.log("app.js started");
})

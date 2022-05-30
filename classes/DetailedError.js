class DetailedError extends Error{

    #sendErrorEmail = false; //does this error alert me?
    #returnToClient = true //is this error returned to the client ?
    #statusCode;
    #throwError = false;

    constructor(message, statusCode = 400, throwError = false, sendErrorEmail = false) {
        super(message);
        this.result = false;
        this.errorMessage = message;
        this.#statusCode = statusCode;
        this.#throwError = throwError;
        this.#sendErrorEmail = sendErrorEmail;
    }

    set returnToClient(value) {
        this.#returnToClient = value;
    }

    set sendErrorEmail(value) {
        this.#sendErrorEmail = value;
    }

    set addErrorFields(errorObject) {
        if (typeof errorObject === 'object') {
            Object.keys(errorObject).forEach(e => {
                this[e] = errorObject[e];
            })
        }
    }

    get statusCode() {
        return this.#statusCode;
    }

    set statusCode(statusCode) {
        this.#statusCode = statusCode;
    }

    set throwError(value) {
        this.#throwError = value;
    }

    get throwError() {
        return this.#throwError;
    }

}

module.exports = {DetailedError};

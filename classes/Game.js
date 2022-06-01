const cosmosDb = require('@azure/cosmos');
const randomKey = require('generate-api-key');
const {DetailedError} = require("./DetailedError");

//I don't know if extending the CosmosClient is a good idea here.  I am going to play with the concept and see how well it works, but maybe Cosmo's should be its own set of functions like Save/Delete/Read etc.
class Game extends cosmosDb.CosmosClient {

    #gameId;
    #containerName;
    data = {};

    constructor(gameId = null) {
        super({endpoint: process.env.cosmosDbUrl, key: process.env.cosmosDbKey});
        this.#containerName = 'tic-tac-toe:games';
        this.#gameId = gameId;
    }

    //return the game id
    get gameId() {
        return this.#gameId;
    }

    //init the db connection
    async #init() {
        const {database} = await this.databases.createIfNotExists({id: "express-demo"});
        const {container} = await database.containers.createIfNotExists({id: this.#containerName, partitionKey: '/gameId'});
        return {
            database, container
        }
    }

    //gets a game by Id.  ID must be set in class.
    async getGame() {

        if (!this.#gameId) {
            return;
        }

        const {database, container} = await this.#init();
        const game = await container.items
            .query({
                query: "SELECT * FROM c where c.gameId=@gameId",
                parameters: [{
                    name: '@gameId',
                    value: this.#gameId
                }]
            })
            .fetchAll();

        if (game?.resources.length===1) {
            this.data = game.resources[0];
        }

    }

    //save the game to cosmos
    async updateGame(updatedState) {

        if (!this.#gameId) {
            throw new DetailedError("gameId is missing");
        }

        //make sure the game state is valid before moving forward.
        if (!Array.isArray(updatedState) || updatedState.length !== 9) {
            throw new DetailedError("array is not the correct size or is not an array");
        }
        const currentStateFilled = this.data.gameState.filter(e => e !== null)
        const newStateFilled = updatedState.filter(e => e !== null);
        if (newStateFilled.length - currentStateFilled.length !== 1) {
            throw new DetailedError("new game board has more than 1 move difference");
        }


        this.data.gameState = updatedState;
        const nextPlayer = this.data.players.filter(e=> e !== this.data.nextPlayer);
        this.data.nextPlayer = nextPlayer[0];

        const {database, container} = await this.#init();
        const results = await container.item(this.data.id, this.data.gameId).replace(this.data);
        this.data = results.resource;

    }

    //create a new game.
    async createGame(players) {

        if (players.length !== 2) {
            throw new Error('game must have 2 players');
        }

        const gameId = randomKey({method:'string', length: 20});
        this.#gameId = gameId;
        const {database, container} = await this.#init();
        this.data = {
            gameId,
            players,
            gameState: new Array(9).fill(null),
            nextPlayer: players[0],
            gameCompleted: false
        }

        return await container.items.create(this.data);


    }

}

module.exports = {Game};

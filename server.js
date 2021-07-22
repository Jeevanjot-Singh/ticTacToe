// check for port number in the arguments
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ticTacToe')
    .then(() => console.log('Connected to Mongo db'))
    .catch(err => console.error('Could not connect to Mongo db...', err))


let gameSchemas = new mongoose.Schema({
    first_player: String,
    second_player: String,
    status: {
        type: Number,
        default: 0
    },
    winner: {
        type: String,
        default: ''
    },
    message: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    }
})
let Game = mongoose.model('Game', gameSchemas)
if (process.argv.length == 3 && !isNaN(process.argv[2])) {
    var io = require('socket.io')(process.argv[2]); //Initialising socket.io using port 5050
} else {
    console.log('Please provide a correct port number');
    process.exit(1);
}

console.log('Server started listening at the port : ' + process.argv[2]);

// Store socket ids of the players
var players = [];

io.on('connection', async function (player) {

    //Reset players length to 0 when game ends
    if (players.length == 0 || players.length == 1) {
        players.push(player)
    }
    else {
        players.length = 0
        players.push(player)
    }
    // console.log(players.length)
    //check if there is 2 players
    if (players.length == 2) {
        let game = new Game({
            first_player: players[0].id,
            second_player: players[1].id,
        })

        let gameObject = await game.save()
        gameObject = gameObject.toJSON()

        // initialize tic-tac-toe board when a new game starts
        var board = ['.', '.', '.', '.', '.', '.', '.', '.', '.'];
        var roleid = 0;

        // game starts and the first in the queue is the first in the game
        io.sockets.connected[players[0].id].emit('GS', 'Game started. You are the first player.');
        io.sockets.connected[players[1].id].emit('GS', 'Game started. You are the second player.');

        players[0].on('move', async function (data) {

            // check if the move is valid & update board
            if (data.move == 'r') {
                io.sockets.emit('RE', data.player)
                let findGame = await Game.findById(gameObject._id);
                findGame.message = data.player == 1 ? 'Game won by first player' : 'Game won by second player';
                findGame.winner = data.player == 1 ? findGame.first_player : findGame.second_player;
                findGame.status = 1;
                await findGame.save()
            }
            else {
                if (validateMove(data.player, roleid, data.move, board)) {
                    if (data.player == 0) {
                        board[data.move - 1] = 'x';
                        roleid = 1;
                    } else {
                        board[data.move - 1] = 'o';
                        roleid = 0;
                    }

                    //Event responsible to print updated game boards on the consoles of both the players
                    io.sockets.emit('accepted', board);

                    var status = checkWinner(board, data.player)
                    if (!status) {
                        io.sockets.emit('GE', 'tied');
                        let findGame = await Game.findById(gameObject._id);
                        findGame.message = 'Game is tied'
                        findGame.status = 2;
                        await findGame.save()
                    };
                    if (status == 1) {
                        io.sockets.emit('GE', data.player);
                        let findGame = await Game.findById(gameObject._id);
                        findGame.message = data.player == 0 ? 'Game won by first player' : 'Game won by second player';
                        findGame.winner = data.player == 0 ? findGame.first_player : findGame.second_player;
                        findGame.status = 1;
                        await findGame.save()
                    };
                };
            }
        });

        players[1].on('move', async function (data) {
            // check if the move is valid & update board
            if (data.move == 'r') {
                io.sockets.emit('RE', data.player);
                let findGame = await Game.findById(gameObject._id);
                findGame.message = data.player == 1 ? 'Game won by first player' : 'Game won by second player';
                findGame.winner = data.player == 1 ? findGame.first_player : findGame.second_player;
                findGame.status = 1;
                await findGame.save()
            }
            else {
                // check if the move is valid & update board
                if (validateMove(data.player, roleid, data.move, board)) {
                    if (data.player == 0) {
                        board[data.move - 1] = 'x';
                        roleid = 1;
                    } else {
                        board[data.move - 1] = 'o';
                        roleid = 0;
                    }

                    //Event responsible to print updated game boards on the consoles of both the players
                    io.sockets.emit('accepted', board);

                    var status = checkWinner(board, data.player)

                    if (!status) {
                        io.sockets.emit('GE', 'tied');
                        let findGame = await Game.findById(gameObject._id);
                        findGame.message = 'Game is tied'
                        findGame.status = 2;
                        await findGame.save()
                    };
                    if (status == 1) {
                        io.sockets.emit('GE', data.player);
                        let findGame = await Game.findById(gameObject._id);
                        findGame.message = data.player == 0 ? 'Game won by first player' : 'Game won by second player';
                        findGame.winner = data.player == 0 ? findGame.first_player : findGame.second_player;
                        findGame.status = 1;
                        await findGame.save()
                    };
                };
            }
        });
    }

});

// validate if it is the correct tour and a legit move
function validateMove(playerId, roleId, move, board) {
    if (playerId == roleId && move < 10 && board[move - 1] == '.') {
        return 1;
    }
    return 0;
}


// check if there is a winner
function checkWinner(board, player) {
    if (board.toString().includes('.')) {
        let status = checkBoard(board, player, 2);
        return status
    }
    else {
        // If all the positions on the boards are filled than again check for winner
        let status = checkBoard(board, player, 0)
        return status
    }
}

// To check if the player scores 3 consecutive points in a  horizontal, vertical or diagonal line
function checkBoard(board, player, number) {
    winner = 0;
    item = 'ooo';
    if (player == 0) item = 'xxx';
    var row1 = board[0] + board[1] + board[2];
    if (row1 == item) {
        return 1
    }
    var row2 = board[3] + board[4] + board[5];
    if (row2 == item) {
        return 1
    }
    var row3 = board[6] + board[7] + board[8];
    if (row3 == item) {
        return 1
    }
    var col1 = board[0] + board[3] + board[6];
    if (col1 == item) {
        return 1
    }
    var col2 = board[1] + board[4] + board[7];
    if (col2 == item) {
        return 1
    }
    var col3 = board[2] + board[5] + board[8];
    if (col3 == item) {
        return 1
    }
    var diag1 = board[0] + board[4] + board[8];
    if (diag1 == item) {
        return 1
    }
    var diag2 = board[2] + board[4] + board[6];
    if (diag2 == item) {
        return 1
    }
    return number
}
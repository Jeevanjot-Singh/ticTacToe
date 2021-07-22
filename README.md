## To start server use command:
                               node server.js 5050

## To connect client to the server use command:
                                               node client.js 127.0.0.1 5050

## Packages used:
            1. mongoose -- version 5.0.1
            2. socket.io -- version 2.1.0
            3. socket.io-client -- version 2.1.0
            4. readcommand -- version 0.3.0
            

## Used Mongo db compass to store the game details and results
## Database name: ticTacToe
## collection name: games
## each document consist of a status key which describes the status of the game
                status: 0 for playing,
                status: 1 for Finished Successfully
                status: 2 for Game Tied

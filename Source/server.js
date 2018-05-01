/**
 * Created by Mathew on 4/30/2018.
 */
/* Internal Dependencies */
const fs      = require(  'fs'    );
const url     = require(  'url'   );
const path    = require(  'path'  );

/* External Dependencies */
const express       = require( 'express'       );
const favicon       = require( 'serve-favicon' );
const bodyParser    = require( 'body-parser'   );
const WebSocket     = require( 'ws'            );
const http          = require( 'http'          );

/* Server Variables */
const port = '8018';
const app = express();
const server = http.createServer(app);
const public_dir = path.join(__dirname, '../WebContent/public');
const rooms = {};
const people = {};
const MESSAGE_TYPES = {
    new_user: 0,
    rooms_list: 1
};


String.prototype.replaceAll = function(search, replacement) {return this.replace(new RegExp(search, 'g'), replacement);};




function init(){
    console.log('Now listening on port: ', port);
    server.listen(port);

    initWebSocket();
}


//app.use(favicon(path.join(public_dir, 'images', 'favicon.ico')));
app.use(bodyParser.json());


app.use('/', express.static(public_dir));


/***********************   User creation   *************************/
app.get('/validUser/:user', (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write('{"valid":' + isValidUser(req.params.user) + '}');
    res.end();
});


function isValidUser(user) {
    return people[user] === undefined;
}

function createNewUser(user, ws){
    people[user] = {room: null};
    ws.username = user;
}


/****************************** *************************************/


/***************************** room handling   *********************/

function getListOfRooms(){
    return rooms;
}

function isCurrentRoom(roomid){
    return rooms[roomid] === undefined
}
function createNewRoom(roomid){
    rooms[roomid] = {current_users: 0};
    wss.broadcastInLobby(JSON.stringify({type:MESSAGE_TYPES.rooms_list, from: 'server', data: getListOfRooms()}));
}

/*************************************** ****************************/




/******************** Websocket Stuff *****************************/

function initWebSocket(){
    const wss = new WebSocket.Server({server: server});

    wss.on('connection', (ws) => {
        
        ws.on('message', (message) => {
            // Broadcast any received message to all clients
            console.log('received: %s', message);
            if(message.type === MESSAGE_TYPES.new_user){
                if(isValidUser(message.from)){
                    createNewUser(message.from, this);
                    this.send(JSON.stringify(rooms));
                }
            }
            else {
                wss.broadcastInRoom(message);
            }
        });
    });

    wss.broadcastInRoom = function(data) {
        this.clients.forEach(function(client) {
            if(client.readyState === WebSocket.OPEN && people[client.username].room === people[data.from].room) {
                client.send(data);
            }
        });
    };

    wss.broadcastInLobby = function(data){
        this.clients.forEach(function(client) {
            if(client.readyState === WebSocket.OPEN && people[client.username].room === null) {
                client.send(data);
            }
        });
    };
    
    console.log('Created Websocket Server')
}

init();
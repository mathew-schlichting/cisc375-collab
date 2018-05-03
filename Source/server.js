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
const SocketIO      = require( 'socket.io'     );

/* Server Variables */
const port = '8018';
const app = express();
const server = http.createServer(app);
const io = SocketIO(server);
var wss = null;
const public_dir = path.join(__dirname, '../WebContent/public');



/* Application Variables */
const rooms = {};
const people = {};
const MESSAGE_TYPES = {
    new_user: 0,
    rooms_list: 1,
    ask_for_rooms: 2,
    create_room: 3,
    join_room: 4,
    leave_room: 5,
    user_joined: 6,
    user_left: 7,
    text_message: 8,
    request_user_list: 9,
    user_list: 10
};


String.prototype.replaceAll = function(search, replacement) {return this.replace(new RegExp(search, 'g'), replacement);};




function init(){
    console.log('Now listening on port: ', port);
    server.listen(port);

    initSocketIO();
    //initWebSocket();
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

function createNewUser(user, color, client){
    people[user] = {username: user, color: color, room: null, client: client};
}

function getColorFor(username){
    return people[username].color
}

/****************************** *************************************/


/***************************** room handling   *********************/

app.get('/validRoom/:roomid', (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write('{"valid":' + !isCurrentRoom(req.params.roomid) + '}');
    res.end();
});

function getListOfRooms(){
    return rooms;
}

function isCurrentRoom(roomid){
    return rooms[roomid] !== undefined
}
function getUserList(roomid){
    var result = [];
    if(roomid !== null) {
        for (var i = 0; i < rooms[roomid].users.length; i++) {
            result.push({username: rooms[roomid].users[i], color: getColorFor(rooms[roomid].users[i])});
        }
    }
    return result;
}

function joinRoom(roomid, username){
    rooms[roomid].users.push(username);
    people[username].room = roomid;
    broadcastInRoom(roomid, 'user_joined', 'server', {username: username});
    broadcastInLobby('rooms_list', 'server', getListOfRooms());
    broadcastInRoom(roomid, 'user_list', 'server', getUserList(roomid));
}
function leaveRoom(username){
    var roomid = people[username].room;
    if(roomid !== null) {
        var index = rooms[roomid].users.indexOf(username);
        if (index >= 0) {
            rooms[roomid].users.splice(index, 1);
            broadcastInRoom(roomid, 'user_list', 'server', getUserList(roomid));
            broadcastInLobby('rooms_list', 'server', getListOfRooms());
        }
        people[username].room = null;
    }
}

function createNewRoom(roomid){
    rooms[roomid] = {users: []};
    broadcastInLobby('rooms_list', 'server', getListOfRooms());
}

/*************************************** ****************************/




/******************** Websocket Stuff *****************************/

function broadcastInLobby(type, from, data){
    for (var p in people) {
        if(people[p].client.readyState === WebSocket.OPEN && people[p].room === null) {
            sendData(people[p].client, type, from, data);
        }
    }
}

function broadcastInRoom(roomid, type, from, data) {
    for (var p in people) {
        if(people[p].client.connected && people[p].room === roomid) {
            sendData(people[p].client, type, from, data);
        }
    }
}

function sendToUser(id, type, from, data){
    if(people[id].client.connected) {
        sendData(people[id].client, type, from, data);
    }
}

function createMessage(from, data){
    return {from: from, data: data};//JSON.stringify({from: from, data: data});
}

function sendData(client, type, from, data){
    client.emit(type, createMessage(from, data));
}



function initSocketIO(){
    var tempClients = {};
    var temp;
    var currentId;

    io.on('connection', (client) => {
        temp = client;
        currentId = Math.floor(Math.random() * 1000);
        tempClients[currentId] = client;

        client.on('init_response', (message) => {
            console.log('Received init_response');
            createNewUser(message.from, message.data.color, tempClients[message.data.id]);
        });

        client.on('request_rooms', (message) => {
            console.log('Received request_rooms');
            sendData(people[message.from].client, 'rooms_list', 'server', getListOfRooms());
        });

        client.on('join_room', (message) => {
            console.log('Received join_room');
            joinRoom(message.data.roomid, message.from);
        });

        client.on('create_room', (message) => {
            console.log('Received create_room');
            createNewRoom(message.data.roomid);
        });

        client.on('request_users', (message) => {
            console.log('Received request_users');
            sendToUser(message.from, 'user_list', 'server', getUserList(people[message.from].room));
        });

        client.on('text_message', (message) => {
            console.log('Received text_message');
            broadcastInRoom(people[message.from].room, 'text_message', message.from, {message: message.data.message, color: people[message.from].color});
        });

        client.on('leave_room', (message) => {
            console.log('Received leave_room');
            leaveRoom(message.from);
        });








        client.emit('init_client', createMessage('server', {id: currentId}));
    });

    console.log('Created SocketIO');
}







function initWebSocket(){
    wss = new WebSocket.Server({server: server});

    wss.on('connection', (client) => {
        var current = client;

        client.on('message', (message) => {
            // Broadcast any received message to all clients
            console.log('received: %s', message);
            message = JSON.parse(message);
            if(message.type === MESSAGE_TYPES.new_user){
                if(isValidUser(message.from)){
                    createNewUser(message.from, message.data, current);
                }
            } else if(message.type === MESSAGE_TYPES.ask_for_rooms){
                sendToUser(message.from, MESSAGE_TYPES.rooms_list, 'server', rooms);
            } else if(message.type === MESSAGE_TYPES.create_room){
                if(!isCurrentRoom(message.data)) {
                    createNewRoom(message.data);
                }
            } else if(message.type === MESSAGE_TYPES.join_room){
                joinRoom(message.data, message.from);
            } else if(message.type === MESSAGE_TYPES.leave_room){
                leaveRoom(message.from);
            } else if(message.type === MESSAGE_TYPES.text_message){
                broadcastInRoom(MESSAGE_TYPES.text_message, message.from, {color: getColorFor(message.from), message: message.data});
            } else if(message.type === MESSAGE_TYPES.request_user_list){
                sendToUser(message.from, MESSAGE_TYPES.user_list, 'server', getUserList(people[message.from].room));
            }
            else {
                // fail gracefully
            }
        });
    });


    console.log('Created Websocket Server')
}

init();
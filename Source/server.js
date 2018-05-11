/**
 * Created by Mathew on 4/30/2018.
 */
/* Internal Dependencies */
const fs = require('fs');
const url = require('url');
const path = require('path');

/* External Dependencies */
const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
//const http = require('http');
const https = require('https');
const SocketIO = require('socket.io');

/* Server Variables */


const options = {
	key: fs.readFileSync(path.join(__dirname, 'cisc-dean.stthomas.edu-server.key')),
	cert: fs.readFileSync(path.join(__dirname, 'cisc-dean.stthomas.edu-server.crt')),
	ca: fs.readFileSync(path.join(__dirname, 'cisc-dean.stthomas.edu-ca.crt'))
};



const port = '8018';
const app = express();
//const server = http.createServer(app);
const server = https.createServer(options, app);
const io = SocketIO(server);
const public_dir = path.join(__dirname, '../WebContent/public');



/* Application Variables */
const rooms = {};
const people = {};



String.prototype.replaceAll = function(search, replacement) {
	return this.replace(new RegExp(search, 'g'), replacement);
};




function init() {
	console.log('Now listening on port: ', port);
	server.listen(port);

	initSocketIO();
	//initWebSocket();
}


app.use(favicon(path.join(public_dir, 'images', 'favicon.ico')));
app.use(bodyParser.json());


app.use('/', express.static(public_dir));


/***********************   User creation   *************************/
app.get('/validUser/:user', (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.write('{"valid":' + isValidUser(req.params.user) + '}');
	res.end();
});


function isValidUser(user) {
	return people[user] === undefined;
}

function createNewUser(user, color, client) {
	people[user] = {
		username: user,
		color: color,
		drawing: {clickX: [], clickY: [], clickSize: [], clickColor: [], clickDrag: []},
		room: null,
		client: client,
		streamid: 0
	};
}

function getColorFor(username) {
	return people[username].color
}

/****************************** *************************************/


/***************************** room handling   *********************/

app.get('/validRoom/:roomid', (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.write('{"valid":' + !isCurrentRoom(req.params.roomid) + '}');
	res.end();
});

function getListOfRooms() {
	return rooms;
}

function isCurrentRoom(roomid) {
	return rooms[roomid] !== undefined
}

function getUserList(roomid) {
	var result = [];
	if (roomid !== null) {
		for (var i = 0; i < rooms[roomid].users.length; i++) {
			result.push({
				username: rooms[roomid].users[i],
				color: getColorFor(rooms[roomid].users[i]),
				streamid: people[rooms[roomid].users[i]].streamid
			});
		}
	}
	return result;
}

function joinRoom(roomid, username) {
    console.log("joinRoom: username = " + username);
	rooms[roomid].users.push(username);
	people[username].room = roomid;
	broadcastInRoom(roomid, 'user_joined', 'server', {username: username});
	sendToUser(username, 'update_drawing', 'server', {drawing: compileMasterDrawingList()});
	broadcastInLobby('rooms_list', 'server', getListOfRooms());
	broadcastInRoom(roomid, 'user_list', 'server', getUserList(roomid));
}

function leaveRoom(username) {
	var roomid = people[username].room;
	if (roomid !== null) {
		var index = rooms[roomid].users.indexOf(username);
		if (index >= 0) {
			rooms[roomid].users.splice(index, 1);
			broadcastInRoom(roomid, 'user_list', 'server', getUserList(roomid));
			broadcastInLobby('rooms_list', 'server', getListOfRooms());
		}
		people[username].room = null;
	}

	people[username].streaming = false;

}

function createNewRoom(roomid) {
	rooms[roomid] = {
		users: []
	};
	broadcastInLobby('rooms_list', 'server', getListOfRooms());
}

/*************************************** ****************************/




function updateDrawing(username, data){
	people[username].drawing = data.drawing;
	broadcastInRoom(people[username].room, 'update_drawing', 'server', {drawing: compileMasterDrawingList()});
}

function compileMasterDrawingList (){
    var masterList = {clickX: [], clickY: [], clickSize: [], clickColor: [], clickDrag: []};

    for(var user in people){
        masterList.clickX = masterList.clickX.concat(people[user].drawing.clickX);
        masterList.clickY = masterList.clickY.concat(people[user].drawing.clickY);
        masterList.clickSize = masterList.clickSize.concat(people[user].drawing.clickSize);
        masterList.clickColor = masterList.clickColor.concat(people[user].drawing.clickColor);
        masterList.clickDrag = masterList.clickDrag.concat(people[user].drawing.clickDrag);
    }

    return masterList;
}





/******************** Websocket Stuff *****************************/

function broadcastInLobby(type, from, data) {
	for (var p in people) {
		if (people[p] && people[p].client !== null && people[p].client.connected && people[p].room === null) {
			sendData(people[p].client, type, from, data);
		}
	}
}

function broadcastInRoom(roomid, type, from, data) {
   	for (var p in people) {
		if (people[p] && people[p].client !== null && people[p].client.connected && Number(people[p].room) === Number(roomid)) {
			sendData(people[p].client, type, from, data);
		}
	}
}

function sendToUser(id, type, from, data) {
	if (people[id].client.connected) {
		sendData(people[id].client, type, from, data);
	}
}

function createMessage(from, data) {
	return {
		from: from,
		data: data
	};
}

function sendData(client, type, from, data) {
	if(client !== null){
        client.emit(type, createMessage(from, data));
    } else {
		console.log('client is null....')
	}
}



function initSocketIO() {
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
			console.log('Received join_room: roomid = ' + message.data.roomid + '; from = ' + message.from);
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
			broadcastInRoom(people[message.from].room, 'text_message', message.from, {
				message: message.data.message,
				color: people[message.from].color
			});
		});

        client.on('leave_room', (message) => {
            console.log('Received leave_room');
            leaveRoom(message.from);
        });

		client.on('rtc', (message) => {
			console.log('Received rtc');
			broadcastInRoom(people[message.from].room, 'rtc', message.from, message.data);
		});

		client.on('start_call', (message) => {
			broadcastInRoom(people[message.from].room, 'start_call', message.from, message.data);
		});

		client.on('update_user_drawing', (message) => {
			updateDrawing(message.from, message.data);
		});

		client.on('start_streaming', (message) => {
			people[message.from].streamid = message.data.id;
			broadcastInRoom(people[message.from].room, 'user_list', 'server', getUserList(people[message.from].room));
		});

		client.on('stop_streaming', (message) => {
			broadcastInRoom(people[message.from].room, 'stop_streaming', message.from, message.data);
		});


        client.emit('init_client', createMessage('server', {id: currentId}));
    });

    console.log('Created SocketIO');
}

init();

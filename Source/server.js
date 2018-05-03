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
const WebSocket = require('ws');
const http = require('http');

/* Server Variables */
const port = '8018';
const app = express();
const server = http.createServer(app);
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


String.prototype.replaceAll = function(search, replacement) {
	return this.replace(new RegExp(search, 'g'), replacement);
};




function init() {
	console.log('Now listening on port: ', port);
	server.listen(port);

	initWebSocket();
}


//app.use(favicon(path.join(public_dir, 'images', 'favicon.ico')));
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

function createNewUser(user, color, ws) {
	people[user] = {
		username: user,
		color: color,
		room: null,
		ws: ws
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
	for (var i = 0; i < rooms[roomid].users.length; i++) {
		result.push({
			username: rooms[roomid].users[i],
			color: getColorFor(rooms[roomid].users[i])
		});
	}
	return result;
}

function joinRoom(roomid, username) {
	rooms[roomid].users.push(username);
	people[username].room = roomid;
	wss.broadcastInRoom(MESSAGE_TYPES.user_joined, username);
	wss.broadcastInLobby(MESSAGE_TYPES.rooms_list, 'server', getListOfRooms());
	wss.sendTo(username, MESSAGE_TYPES.user_list, 'server', getUserList(roomid));
}

function leaveRoom(username) {
	var roomid = people[username].room;
	if (roomid !== null) {
		var index = rooms[roomid].users.indexOf(username);
		if (index >= 0) {
			rooms[roomid].users.splice(index, 1);
			wss.broadcastInRoom(MESSAGE_TYPES.user_left, username);
			wss.broadcastInLobby({
				type: MESSAGE_TYPES.rooms_list,
				from: 'server',
				data: getListOfRooms()
			});
		}
		people[username].room = null;
	}
}

function createNewRoom(roomid) {
	rooms[roomid] = {
		users: []
	};
	wss.broadcastInLobby(MESSAGE_TYPES.rooms_list, 'server', getListOfRooms());
}

/*************************************** ****************************/




/******************** Websocket Stuff *****************************/


function createMessage(type, from, data) {
	return JSON.stringify({
		type: type,
		from: from,
		data: data
	});
}

function initWebSocket() {
	wss = new WebSocket.Server({
		server: server
	});

	wss.on('connection', (ws) => {
		var current = ws;

		ws.on('message', (message) => {
			// Broadcast any received message to all clients
			console.log('received: %s', message);
			message = JSON.parse(message);
			if (message.type === MESSAGE_TYPES.new_user) {
				if (isValidUser(message.from)) {
					createNewUser(message.from, message.data, current);
				}
			} else if (message.type === MESSAGE_TYPES.ask_for_rooms) {
				wss.sendTo(message.from, MESSAGE_TYPES.rooms_list, 'server', rooms);
			} else if (message.type === MESSAGE_TYPES.create_room) {
				if (!isCurrentRoom(message.data)) {
					createNewRoom(message.data);
				}
			} else if (message.type === MESSAGE_TYPES.join_room) {
				joinRoom(message.data, message.from);
			} else if (message.type === MESSAGE_TYPES.leave_room) {
				leaveRoom(message.from);
			} else if (message.type === MESSAGE_TYPES.text_message) {
				wss.broadcastInRoom(MESSAGE_TYPES.text_message, message.from, {
					color: getColorFor(message.from),
					message: message.data
				});
			} else if (message.type === MESSAGE_TYPES.request_user_list) {
				wss.sendTo(message.from, MESSAGE_TYPES.user_list, 'server', getUserList(people[message.from].room));
			} else {
				// fail gracefully
			}
		});
	});

	wss.sendTo = function(id, type, from, data) {
		for (var p in people) {
			if (people[p].ws.readyState === WebSocket.OPEN && p === id) {
				sendData(people[p].ws, type, from, data);
			}
		}
	};

	wss.broadcastInRoom = function(type, from, data) {
		for (var p in people) {
			if (people[p].ws.readyState === WebSocket.OPEN && people[from].room === people[p].room) {
				sendData(people[p].ws, type, from, data);
			}
		}
	};

	wss.broadcastInLobby = function(type, from, data) {
		for (var p in people) {
			if (people[p].ws.readyState === WebSocket.OPEN && people[p].room === null) {
				console.log('Sending: ', data, ' to ', p);
				sendData(people[p].ws, type, from, data);
			}
		}
	};


	console.log('Created Websocket Server')
}

function sendData(ws, type, from, data) {
	ws.send(createMessage(type, from, data));
}

init();
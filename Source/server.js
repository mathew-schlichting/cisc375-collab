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
const rooms = [];
const people = [];

String.prototype.replaceAll = function(search, replacement) {return this.replace(new RegExp(search, 'g'), replacement);};




function init(){
    console.log('Now listening on port: ', port);
    server.listen(port);

    initWebSocket();
}


//app.use(favicon(path.join(public_dir, 'images', 'favicon.ico')));
app.use(bodyParser.json());


app.use('/', express.static(public_dir));

app.get('/validUser/:user', (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write('{"valid":' + isValidUser(req.params.user) + '}');
    res.end();
});


function isValidUser(user) {
    var result = true;
    people.forEach(function (person){
        result = result && person.user !== user;
    });
    return result;
}


/******************** Websocket Stuff *****************************/

function initWebSocket(){
    const wss = new WebSocket.Server({server: server});

    wss.on('connection', (ws) => {
        
        ws.on('message', (message) => {
            // Broadcast any received message to all clients
            console.log('received: %s', message);
            wss.broadcast(message);
        });
    });

    wss.broadcast = function(data) {
        this.clients.forEach(function(client) {
            if(client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    };
    
    console.log('Created Websocket Server')
}

init();
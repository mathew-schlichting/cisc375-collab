/**
 * Created by Mathew on 4/30/2018.
 */
/* Internal Dependencies */
var fs      = require(  'fs'    );
var url     = require(  'url'   );
var path    = require(  'path'  );

/* External Dependencies */
var express     = require( 'express'       );
var favicon     = require( 'serve-favicon' );
var bodyParser  = require( 'body-parser'   );


/* Server Variables */
var port = '8018';
var app = express();
var public_dir = path.join(__dirname, '../WebContent/public');


String.prototype.replaceAll = function(search, replacement) {return this.replace(new RegExp(search, 'g'), replacement);};




function init(){
    console.log('Now listening on port: ', port);
    app.listen(port)
}


//app.use(favicon(path.join(public_dir, 'images', 'favicon.ico')));
app.use(bodyParser.json());


app.use('/', express.static(public_dir));





init();
//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');
var ejs = require('ejs');
var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var router = express();

// EJS:
ejs.open = '{{';
ejs.close = '}}';

// Config:
router.configure(function() {
    router.set('port', process.env.PORT || 3000);
    router.set('views', __dirname + '/public');
    router.engine('html', ejs.renderFile);
    router.use(express.favicon());
    router.use(express.logger('dev'));
    router.use(express.bodyParser());
    router.use(express.methodOverride());
    router.use(express.static(__dirname + '/public', { maxAge: 3600000 }));
});

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//

var server = http.createServer(router);
var io = socketio.listen(server);

// router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}



// Router:
function showIndex(req, res, next) {
    var ua = req.headers['user-agent'];
    // if(req.query.ua && req.query.ua === 'mobile' ) {
    //     res.render('m-index.html');
    // } else if(ua.match(/Android/i) || ua.match(/iPhone|iPad|iPod/i) || ua.match(/IEMobile/i)) {
    //     res.render('mobile.html');
    // } else 
    res.render('index.html');
}
router.get('/', function(req, res, next) { res.render('index.html'); });
router.get('/about', function(req, res, next) { res.render('about.html'); });
router.get('/contact', function(req, res, next) { res.render('contact.html'); });

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

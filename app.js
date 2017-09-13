var express = require('express');
var http = require('http');
var fs = require('fs');
var app = express();
var server = http.createServer(app);

var redis = require('redis');
var redisClient = redis.createClient();

var pg = require('pg');
var connexionString = "postgres://rooms:rooms@localhost/rooms";
var queryToShow = 'SELECT * FROM room ORDER BY name';

var postgresClient = new pg.Client(connexionString);
postgresClient.connect(function(err) {
    if (err) {
        return console.error('could not connect to postgres', err);
    }
    performQuery(); //initialises the rooms
    postgresClient.on('notification', function(msg) {
        console.log(msg);
        performQuery();
    });
    var listenQuery = postgresClient.query("LISTEN watchers");
});

var rooms = [];
// Make the database query and broadcasts it
var performQuery = function() {
    postgresClient.query(queryToShow, function(err, result) {
        if (err) {
            return console.error('error running query', err);
        } else if (result) {
            rooms = result.rows;
            console.log(JSON.stringify(rooms));
            broadcast();
        }
    });
};


var sses = [];

function startSse(res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write("\n");

    return function sendSse(name, data) {
        res.write("event: " + name + "\n");
        res.write("data: " + JSON.stringify(data) + "\n\n");
    };
}

function broadcast() {
    console.log(sses);
    for (i = 0; i < sses.length; i++) {
        sendRooms(sses[i]);
    }
}

function sendRooms(sse) {
    console.log('SENDING');
    var data = {};
    data.rooms = rooms;
    data.time = new Date();
    sse('rooms', data);
}

function testCookies(req) {
    var cookies = (req.headers.cookie || '').split(';').reduce(function(obj, item) {
        var tmp = (item || '').split('=');
        obj[tmp[0]] = tmp[1];
        return obj;
    }, {});

    if (!cookies.PHPSESSID) {
        return false;
    }

    redisClient.get('PHPSESSID:' + cookies.PHPSESSID, function(err, data) {
        if (err || data === '') {
            return false;
        }
    });
    return true;
}


app.get('/', function(req, res) {
    if (testCookies(req)) {
        res.sendFile(__dirname + '/index.html');
    } else {
        return res.redirect('http://localhost:80/');
    }
});

app.get('/sse', function(req, res) {
    if (testCookies(req)) {
        var sse = startSse(res);
        sses.push(sse);
        console.log('new SSE');

        sendRooms(sse);

        req.on("end", function() {
            disconnect(sse);
        });
        req.on("close", function() {
            disconnect(sse);
        });
    } else {
        return res.redirect('http://localhost:80/');
    }
});

function disconnect(sse) {
    var index = sses.indexOf(sse);
    if (index > -1) {
        sses.splice(index, 1);
    }
    console.log('SSE disconnected');
}

server.listen(8080);

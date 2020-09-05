const zum = require('zumjs');
const express = require('express');
const app = express();
// const https = require('https');  // https
const http = require('http').createServer(app);
const fs = require('fs');
// const io = require('socket.io')(https);  // https
const io = require('socket.io')(http);
const WikiFakt = require('wikifakt');  // why not

const {ChatRoom} = require('./db/models');

const {createRoom} = require('./functions/createRoom');
const {joinRoom} = require('./functions/joinRoom');
const {leaveRoom} = require('./functions/leaveRoom');
const {destroyRoom} = require('./functions/destroyRoom');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname + '/static', { dotfiles: 'allow' }));  // ssl domain verify

let port = process.env.PORT || 80;

zum.configure({
    // zum configuration
});

// Express Endpoints

// Creating a room in the database
app.post('/chat/create', (req,res) => {
    let user = req.body.user;
    let access_token = req.get('x-auth-token');
    zum.verify(user, access_token, (err) => {
        if(err) {
            return res.sendStatus(401);
        }
        createRoom(req, res);
    });
});

// Socket io events

io.on('connection', socket => {

    // Connection variables
    let username = null;
    let auth = false;
    let chatroom = null;
    
    // Authenticating and adding user to a room
    socket.on('auth', (data) => {
        let room = data.room;
        let passphrase = data.passphrase;
        let user = data.user;
        let access_token = data.token;
        zum.verify(user, access_token, (err) => {
            if(err) {
                return socket.emit('auth-error', 'Authentication failed. It may be a server error or you need to login again!');
            }
            auth = true;
            username = user;
            joinRoom(room, passphrase, user, (status_code, enc) => {
                if(status_code === 200) {
                    // Join room and give user the encryption key
                    socket.emit('join-success');
                    socket.emit('enc', enc);
                    chatroom = room;
                    socket.emit('start-chat');  // client app creates the chat terminal
                }
                else if(status_code === 201) {
                    // Room full
                    socket.emit('room-auth-error', 'Room is full! Currently zelta chat is in beta and has a limit of 50 people per room.');
                }
                else if(status_code === 403) {
                    // Wrong passphrase
                    socket.emit('room-auth-error', 'Wrong passphrase');
                }
                else if(status_code === 404) {
                    // Room not found
                    socket.emit('room-auth-error', 'Room not found');
                }
                else {
                    // Server error
                    socket.emit('server-error', 'Server busy or down');
                }
            });
        });
    });

    // Join socket io room and throw new member notification
    socket.on('in-chat', () => {
        socket.join(chatroom, (err) => {
            if(err) {
                socket.emit('bot', '[PM] There was a problem connecting you to the room. You may try reconnecting again.');
                return socket.emit('join-failed');
            }
            socket.to(chatroom).emit('bot', `${username} has joined the chat`);
        });
    });
    
    // Handle client messages
    socket.on('msg', (message) => {
        if(!auth) {
            return socket.emit('unauthorized');
        }
        socket.to(chatroom).emit('msg', {from:username, msg:message});
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        socket.to(chatroom).emit('bot', `${username} has left the chat`);     
    });

    // Handle intentional disconnection
    socket.on('exit', () => {
        // delete from database
        leaveRoom(chatroom, username);
    });

    // Handle call to list all members
    socket.on('members', () => {
        ChatRoom.find({room:chatroom}).then((result) => {
            let room = result[0];
            let members = room.members.toString();
            io.to(chatroom).emit('bot', `${room.members.length} people are currently online : ${members}. This list may also contain members who are temporarily disconnected and are trying to reconnect.`);
        }, (err) => {
            io.to(chatroom).emit('bot', 'Server is currently overloaded! Disconnection risks are high.');         
        });
    });

    // Handle call for a random fact
    socket.on('fact', () => {
        WikiFakt.getRandomFact().then(function(fact) {
            io.to(chatroom).emit('bot', `Heres a fact : ${fact}`);
        }, (err) => {
            io.to(chatroom).emit('bot', `No fact for you!`);
        });
    });

    // Handle call for closing room
    socket.on('destroy', () => {
        destroyRoom(chatroom, username, (status) => {
            if (status === 200) {
                io.to(chatroom).emit('close');
                return io.to(chatroom).emit('bot', `${username} has decided to close the room. This room will self destruct in 30 seconds!`);
            }
            if (status === 201) {
                return socket.emit('bot', '[PM] Your command cannot be accepted as you are not the room owner');
            }
            if (status === 404) {
                return socket.emit('bot', '[PM] Looks like we have a technical glitch. Your command cannot be executed.');
            }
            io.to(chatroom).emit('bot', 'Server is currently overloaded! Disconnection risks are high.');
        });
    });

});

// https server
// https.createServer({
//     key: fs.readFileSync('/etc/letsencrypt/live/v1.zelta.gq/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/v1.zelta.gq/cert.pem'),
//     ca: fs.readFileSync('/etc/letsencrypt/live/v1.zelta.gq/chain.pem')
// }, app).listen(port, () => {
//     console.log('Server started');
// });

// http server
http.listen(port, () => {
    console.log(`listening on port ${port}`);
});

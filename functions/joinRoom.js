// Module to join a chat room
const {ChatRoom} = require('../db/models');
const {decode} = require('./encryptor');

function joinRoom(room, passphrase, user, callback) {
    ChatRoom.find({room:room}).then((result) => {
        if(result.length === 0) {
            if(callback)
                callback(404, null);
        }
        let chatRoom = result[0];
        // chatroom member limit (50)
        if(chatRoom.members.length >= 50) {
            if(callback)
                callback(201, null);
        }
        decode(passphrase, chatRoom.passphrase, (match) => {
            if(match) {
                if(!chatRoom.members.includes(user)) {
                    chatRoom.members.push(user);
                    chatRoom.save().then(() => {
                        if(callback)
                            callback(200, {key : chatRoom.key, algo : chatRoom.algo});
                    }, (err) => {
                        if(callback)
                            callback(500, null);        
                    });
                }
                else {
                    if(callback)
                        callback(200, {key : chatRoom.key, algo : chatRoom.algo});
                }
            }
            else {
                if(callback)
                    callback(403, null);
            }
        }, (err) => {
            console.error(err);
            if(callback)
                callback(500, null);
        });
    }, (err) => {
        console.error(err);
        if(callback)
            callback(500, null);
    });
}

module.exports = {joinRoom};
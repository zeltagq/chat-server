// Destroy chatroom
const {ChatRoom} = require('../db/models');

function destroyRoom(room, commander, callback) {
    ChatRoom.find({room:room}).then((result) => {
        if(result.length !== 0) {
            let chatroom = result[0];
            if(chatroom.creator === commander) {
                // commander is the creator of the room
                chatroom.remove().then(() => {
                    if(callback)
                        callback(200)
                }, (err) => {
                    if(callback)
                        callback(500)
                });
            }
            else {
                // wrong commander
                if(callback)
                    callback(201)
            }
        }
        else {
            if(callback)
                callback(404)
        }
    }, (err) => {
        if(callback)
            callback(500);
    });
}

module.exports = {destroyRoom};
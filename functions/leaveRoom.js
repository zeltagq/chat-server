// Module to leave a room
const {ChatRoom} = require('../db/models');

function leaveRoom(room, user) {
    ChatRoom.find({room:room}).then((result) => {
        let chatroom = result[0];
        let user_index = chatroom.members.indexOf(user);
        chatroom.members.splice(user_index, 1);
        chatroom.save().then(() => {
            // Do something or pass a callback if you want
        }, (err) => {
            console.error(err);    
        });
    }, (err) => {
        console.error(err);
    });
};

module.exports = {leaveRoom};
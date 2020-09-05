// Module to create new chat room
const {ChatRoom} = require('../db/models');
const cryptoKey = require('secure-random');

function createRoom(req, res) {
    ChatRoom.find({room:req.body.room}).then((result) => {

        if(result.length !== 0) {
            return res.sendStatus(201);  // room exists
        }
        let k = cryptoKey(256, {type : 'Buffer'});
        let key = k.toString('base64');
        let chatRoom = new ChatRoom({
            room : req.body.room,
            key : key,
            algo : req.body.enc,
            passphrase : req.body.passphrase,
            creator : req.body.user,
            members : []
        });
        chatRoom.save().then(() => {
            res.sendStatus(200);
        }, (err) => {
            res.sendStatus(500);
            console.error(err);
        });

        }, (err) => {
            res.sendStatus(500);
            console.error(err); 
    });
}

module.exports = {createRoom};
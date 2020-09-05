const { db } = require('./dbconf');
const {encrypt} = require('../functions/encryptor');

let ChatRoomSchema = new db.Schema({
    room : {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: true
    },
    key : {
        type: String,
        required: true,
        trim: true,
        min: 1,
        unique: true
    },
    algo : {
        type: String,
        required: true
    },
    passphrase : {
        type: String,
        required: true,
        trim: true,
        min: 1
    },
    creator : {
        type: String,
        required: true
    },
    members : {
        type: Array,
        required: true
    }
});

// Encrypt group passkey before saving
ChatRoomSchema.pre('save', function (next) {
    let chatRoom = this;
    if (chatRoom.isModified('passphrase')) {
        encrypt(chatRoom.passphrase, (err, hash) => {
            if (!err) {
                chatRoom.passphrase = hash;
            }
            next();
        });
    } else {
        next();
    }
});

let ChatRoom = db.model('ChatRoom', ChatRoomSchema);

module.exports = {ChatRoom};
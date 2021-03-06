const db = require('mongoose');

db.Promise = global.Promise;

// Development
db.connect(process.env.MURI, { useNewUrlParser: true, useUnifiedTopology: true }).then(
    () => { console.log('Connection to database established') }
).catch((err) => {
    console.log(err);
});

module.exports = { db };
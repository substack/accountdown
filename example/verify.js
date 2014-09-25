var accountdown = require('../');
var level = require('level');
var db = level('/tmp/users.db');

var users = accountdown(db, {
    login: { basic: require('accountdown-basic') }
});

var creds = { username: 'substack', password: 'beep boop' };
users.verify('basic', creds, function (err, id) {
    if (err) return console.error(err);
    console.log('ok=', ok);
    console.log('id=', id);
});

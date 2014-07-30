var accountdown = require('../');
var level = require('level');
var db = level('/tmp/users.db');

var users = accountdown(db, {
    login: { basic: require('accountdown-basic') }
});
users.get(process.argv[2], function (err) {
    if (err) console.error(err);
});

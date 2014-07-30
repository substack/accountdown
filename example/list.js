var accountdown = require('../');
var level = require('level');
var db = level('/tmp/users.db');

var users = accountdown(db, {
    login: { basic: require('accountdown-basic')() }
});
users.list().on('data', console.log);

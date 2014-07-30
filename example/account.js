var accountdown = require('../');
var level = require('level');
var db = level('/tmp/users.db');

var users = accountdown(db, {
    login: { basic: require('accountdown-basic') }
});

var opts = {
    login: { basic: { username: 'substack', password: 'beep boop' } },
    value: { bio: 'beep boop' }
};
users.create('substack', opts, function (err) {
    if (err) console.error(err);
});

var accountdown = require('../');
var level = require('level');
var bytewise = require('bytewise');

var accounts = accountdown(level('/tmp/accountdown.db'), {
    keyEncoding: bytewise,
    valueEncoding: 'json'
});

accounts.create('substack', {}, function (s) {
    s.addLogin('basic', { username: 'substack', password: 'beep' });
});

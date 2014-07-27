#!/usr/bin/env node

var accountdown = require('../');
var level = require('level');
var bytewise = require('bytewise');
var minimist = require('minimist');
var through = require('through2');

var argv = minimist(process.argv.slice(2));

var accounts = accountdown(level('/tmp/accountdown.db'), {
    keyEncoding: bytewise,
    valueEncoding: 'json'
});

var cmd = argv._[0];
if (cmd === 'create') {
    accounts.create(argv._[1], {});
}
else if (cmd === 'remove' || cmd === 'rm') {
    var user = argv._[0];
    accounts.remove(user, function (err) {
        if (err) exit(err, 2)
    });
}
else if (cmd === 'add') {
    var user = argv._[0], type = argv._[1], pw = argv._[2];
    
    accounts.get(user, function (err, u) {
        if (err) exit(err, 2)
        else u.addLogin(type, { username: user, password: pw });
    });
}
else if (cmd === 'list') {
    var s = accounts.list();
    s.on('error', function (err) { exit(err, 2) });
    s.pipe(through(function (name, enc, next) {
        console.log(name);
        next();
    }));
}
else if (cmd === 'verify') {
    var type = argv._[0], user = argv._[1], pw = argv._[2];
    if (type === 'basic') {
        var creds = { username: user, password: pw };
        accounts.verify(type, creds, function (err, ok) {
            if (err) exit(err, 2);
            else if (!ok) exit('failed', 1)
        });
    }
    else exit('unrecognized type', 4)
}
else exit('unrecognized', 3)

function exit (err, code) {
    console.error(String(err));
    process.exit(code);
}

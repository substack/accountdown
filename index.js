var bytewise = require('bytewise');
var xtend = require('xtend');
var shasum = require('shasum');
var through = require('through2');

var User = require('./lib/user.js');

module.exports = Account;

function Account (db) {
    if (!(this instanceof Account)) return new Account(db);
    this._db = db;
}

Account.prototype.create = function (name, row, cb) {
    var key = [ 'account', name ];
    this._db.put(key, row, this._opts, function (err, row) {
        if (err) cb(err)
        else cb(null, new User(this, name, row))
    });
};

Account.prototype.get = function (name, cb) {
    this._db.get(name, function (err, row) {
        if (err) cb(err)
        else cb(null, new User(this, name, row))
    });
};

Account.prototype.list = function () {
    var s = this._db.createKeyStream({
        start: [ 'account', null ],
        end: [ 'account', undefined ]
    });
    return s.pipe(through(function (key, enc, next) {
        this.push(key[1]);
        next();
    }));
};

Account.prototype.addLogin = function (type, creds, cb) {
    if (type === 'basic') {
        var key = [ 'login', type, creds[1] ];
        this._db.put(key, row, this._opts, function (err, row) {
            if (err) cb(err)
            else cb(null, new User(this, name, row))
        });
    }
};

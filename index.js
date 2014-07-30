var bytewise = require('bytewise');
var create = require('level-create');
var batch = require('level-create-batch');
var isarray = require('isarray');

var sublevel = require('level-sublevel');

module.exports = Account;

function Account (db, opts) {
    if (!opts) opts = {};
    if (!(this instanceof Account)) return new Account(db, opts);
    this._db = sublevel(db).sublevel('account', {
        keyEncoding: bytewise,
        valueEncoding: opts.valueEncoding || 'json'
    });
    this._logins = opts.login || {};
}

Account.prototype.register = function (name, lg) {
    this._logins[name] = lg;
};

Account.prototype.create = function (id, opts, cb) {
    if (!opts) opts = {};
    var rows = [];
    var value = opts.value === undefined ? {} : opts.value;
    
    var rows = [
        { key: [ 'account', id ], value: value }
    ];
    
    var keys = Object.keys(opts.login || {});
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var lg = this._logins[key];
        var creds = opts.login[key];
        if (!lg) return nextErr(cb, 'login not registered for type: ' + key);
        
        var xrows = lg.create(id, creds);
        if (!xrows) return nextErr(cb, 'login did not return any rows');
        if (!isarray(xrows)) return nextErr(cb, xrows);
        
        for (var j = 0; j < xrows.length; j++) {
            var row = xrows[j];
            rows.push({
                key: [ 'login', key ].concat(row.key),
                value: row.value
            });
        }
    }
    batch(this._db, rows, function (err) {
        if (err && cb) cb(err);
    });
};

Account.prototype.get = function (id, cb) {
    this._db.get([ 'account', id ], cb);
};

Account.prototype.remove = function (id, cb) {
    this._db.del([ 'account', id ], cb);
};

Account.prototype.list = function () {
    return this._db.createKeyStream({
        gt: [ 'account', null ],
        lt: [ 'account', undefined ]
    });
};

Account.prototype.addLogin = function (id, type, creds, cb) {
    var lg = this._logins[type];
    if (!lg) return nextErr(cb, 'No login registered for type: ' + type);
    var xrows = lg.create(id, creds);
    if (!xrows) return nextErr(cb, 'login did not return any rows');
    if (!isarray(xrows)) return nextErr(cb, xrows);
    batch(this._db, xrows, function (err) {
        if (err && cb) cb(err);
    });
};

Account.prototype.verify = function (type, creds, cb) {
    var lg = this._logins[type];
    if (!lg) return nextErr(cb, 'No login registered for type: ' + type);
    lg.verify(this._db, [ 'login', type ], creds, cb);
};

function nextErr (cb, msg) {
    if (cb) process.nextTick(function () {
        cb(typeof msg === 'string' ? new Error(msg) : msg);
    });
}

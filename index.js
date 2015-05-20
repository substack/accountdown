var batch = require('level-create-batch');
var defaults = require('levelup-defaults');

var bytewise = require('bytewise');
var isarray = require('isarray');
var through = require('through2');
var defined = require('defined');
var readonly = require('read-only-stream');

module.exports = Account;

function Account (db, opts) {
    var self = this;
    if (!(this instanceof Account)) return new Account(db, opts);
    if (!opts) opts = {};
    
    this._db = defaults(db, {
        keyEncoding: bytewise,
        valueEncoding: opts.valueEncoding || 'json'
    });
    
    this._logins = opts.login || {};
    Object.keys(opts.login || {}).forEach(function (key) {
        var lg = opts.login[key];
        self._logins[key] = lg(self._db, [ 'login', key ]);
    });
}

Account.prototype.register = function (type, lg) {
    this._logins[type] = lg(this._db, [ 'login', type ]);
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
        
        var xrows = lg.create(id, creds, opts);
        if (!xrows) return nextErr(cb, 'login did not return any rows');
        if (!isarray(xrows)) return nextErr(cb, xrows);
        
        rows.push.apply(rows, xrows);
        rows.push({
            key: [ 'login-id', id, key ],
            value: 0
        });
        for (var j = 0; j < xrows.length; j++) {
            rows.push({
                key: [ 'login-data', id, key ].concat(xrows[j].key),
                value: 0
            });
        }
    }
    batch(this._db, rows, function (err) { if (cb) cb(err) });
};

Account.prototype.get = function (id, cb) {
    this._db.get([ 'account', id ], cb);
};

Account.prototype.put = function (id, value, cb) {
    var db = this._db;
    this.get(id, function (err, v) {
        // refuse to create new entries, use create() for that
        if (err) return cb(err);
        db.put([ 'account', id ], value, cb);
    });
};

Account.prototype.remove = function (id, cb) {
    var self = this;
    var rows = [], pending = 2;
    rows.push({
        type: 'del',
        key: [ 'account', id ]
    });
    var st = this._db.createReadStream({
        gt: [ 'login-id', id, null ],
        lt: [ 'login-id', id, undefined ]
    });
    st.on('error', onerror);
    st.pipe(through.obj(swrite, end));
    
    var s = this._db.createReadStream({
        gt: [ 'login-data', id, null ],
        lt: [ 'login-data', id, undefined ]
    });
    s.on('error', onerror);
    s.pipe(through.obj(write, end));
    
    function write (row, enc, next) {
        rows.push({ type: 'del', key: row.key.slice(3) });
        rows.push({ type: 'del', key: row.key });
        next();
    }
    
    function swrite (row, enc, next) {
        rows.push({ type: 'del', key: row.key });
        next();
    }
    
    function end () {
        if (--pending !== 0) return;
        self._db.batch(rows, cb);
    }
    function onerror (err) {
        var f = cb;
        cb = function () {};
        f(err);
    }
};

Account.prototype.list = function (opts) {
    if (!opts) opts = {};
    var gt = defined(opts.gt, opts.start, null);
    var lt = defined(opts.lt, opts.end, undefined);
    // todo: gte, lte
    
    var dopts = {
        gt: [ 'account', gt ],
        lt: [ 'account', lt ],
        keys: defined(opts.keys, true),
        values: defined(opts.values, true)
    };
    var s = this._db.createReadStream(dopts);
    
    return s.pipe(through.obj(function (row, enc, next) {
        if (dopts.keys && !dopts.values) {
            this.push(row.key[1]);
        }
        else if (!dopts.keys && dopts.values) {
            this.push(row);
        }
        else {
            this.push({
                key: row.key[1],
                value: row.value
            });
        }
        next();
    }));
};

Account.prototype.addLogin = function (id, type, creds, cb) {
    var lg = this._logins[type];
    if (!lg) return nextErr(cb, 'No login registered for type: ' + type);
    var xrows = lg.create(id, creds);
    if (!xrows) return nextErr(cb, 'login did not return any rows');
    if (!isarray(xrows)) return nextErr(cb, xrows);
    
    var rows = xrows.slice();
    rows.push({ key: [ 'login-id', id, type ], value: 0 });
    for (var j = 0; j < xrows.length; j++) {
        rows.push({
            key: [ 'login-data', id, type ].concat(xrows[j].key),
            value: 0
        });
    }
    batch(this._db, rows, function (err) {
        if (err && cb) cb(err)
        else if (cb) cb(null)
    });
};

Account.prototype.listLogin = function (id, cb) {
    var s = this._db.createReadStream({
        gt: [ 'login-id', id, null ],
        lt: [ 'login-id', id, undefined ]
    });
    var tr = through.obj(function (row, enc, next) {
        this.push({ key: row.key[2] });
        next();
    });
    return readonly(s.pipe(tr));
};

Account.prototype.removeLogin = function (id, type, cb) {
    var self = this;
    var rows = [];
    rows.push({
        type: 'del',
        key: [ 'login-id', id, type ]
    });
    var s = this._db.createReadStream({
        gt: [ 'login-data', id, null ],
        lt: [ 'login-data', id, undefined ]
    });
    s.pipe(through.obj(write, end));
    
    function write (row, enc, next) {
        rows.push({ type: 'del', key: row.key.slice(3) });
        rows.push({ type: 'del', key: row.key });
        next();
    }
    function end () {
        self._db.batch(rows, cb);
    }
};

Account.prototype.verify = function (type, creds, cb) {
    var lg = this._logins[type];
    if (!lg) return nextErr(cb, 'No login registered for type: ' + type);
    lg.verify(creds, cb);
};

function nextErr (cb, msg) {
    if (cb) process.nextTick(function () {
        cb(typeof msg === 'string' ? new Error(msg) : msg);
    });
}

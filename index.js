var batch = require('level-create-batch');
var sublevel = require('level-sublevel');

var bytewise = require('bytewise');
var isarray = require('isarray');
var through = require('through2');
var defined = require('defined');

module.exports = Account;

function Account (db, opts) {
    var self = this;
    if (!(this instanceof Account)) return new Account(db, opts);
    if (!opts) opts = {};
    
    this._db = sublevel(db).sublevel('account', {
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
    this._logins[name] = lg(this._db, [ 'login', type ]);
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
        
        rows.push.apply(rows, xrows);
    }
    batch(this._db, rows, function (err) { if (cb) cb(err) });
};

Account.prototype.get = function (id, cb) {
    this._db.get([ 'account', id ], cb);
};

Account.prototype.put = function (id, value, cb) {
    this._db.put([ 'account', id ], value, cb);
};

Account.prototype.remove = function (id, cb) {
    this._db.del([ 'account', id ], cb);
};

Account.prototype.list = function (opts) {
    if (!opts) opts = {};
    var gt = defined(opts.gt, opts.start, null);
    var lt = defined(opts.lt, opts.end, undefined);
    // todo: gte, lte
    
    var dopts = {
        keyEncoding: 'binary',
        gt: bytewise.encode([ 'account', gt ]),
        lt: bytewise.encode([ 'account', lt ]),
        keys: defined(opts.keys, true),
        values: defined(opts.values, true)
    };
    var s = this._db.createReadStream(dopts)
    
    return s.pipe(through.obj(function (row, enc, next) {
        if (dopts.keys && !dopts.values) {
            this.push(decode(this, row));
        }
        else if (!dopts.keys && dopts.values) {
            this.push(row);
        }
        else {
            this.push({
                key: decode(this, row.key),
                value: row.value
            });
        }
        next();
    }));
    
    function decode (stream, bkey) {
        var key = Buffer.concat([ Buffer([0xa0]), bkey.slice(1) ]);
        var dkey = bytewise.decode(key)
        if (!isarray(dkey) || dkey[0] !== 'account') {
            stream.emit('error', new Error('unexpected decoded key: ' + dkey));
        }
        return dkey[1];
    }
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
    lg.verify(creds, cb);
};

function nextErr (cb, msg) {
    if (cb) process.nextTick(function () {
        cb(typeof msg === 'string' ? new Error(msg) : msg);
    });
}

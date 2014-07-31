# accountdown

manage accounts with leveldb

[![build status](https://secure.travis-ci.org/substack/accountdown.png)](http://travis-ci.org/substack/accountdown)

# example

## create

To create a user, we can just do:

``` js
var accountdown = require('accountdown');
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
```

The string we gave to `users.create()` need not necessarily match the `username`
credential. You might want to use a `uid` integer for example. In either case
you will get implicitly encforced unique names because if a username already
exists the `users.create()` call will fail even if the `id` is available and
likewise if an `id` is unavailable but a username is available.

## verify

To verify a credential:

``` js
var accountdown = require('accountdown');
var level = require('level');
var db = level('/tmp/users.db');

var users = accountdown(db, {
    login: { basic: require('accountdown-basic') }
});

var creds = { username: 'substack', password: 'beep boop' };
users.verify('basic', creds, function (err, ok) {
    if (err) console.error(err)
    else console.log('verified:', ok)
});
```

# methods

``` js
var accountdown = require('accountdown')
```

## var users = accountdown(db, opts)

Create a new account instance `users` given a leveldb database handle `db` and
some options `opts`.

`opts` can be:

* `opts.login` - map of type names to login plugin functions
* `opts.valueEncoding` - value encoding to use, 'json' by default

## users.create(id, opts, cb)

Create a user by an `id`.

## users.verify()

## users.list()

## users.get(id, cb)

Get the data for a username

## users.put(id, cb)

## users.remove(id, cb)

## users.register(type, plugin)

Register a login `plugin` at a string name `type`.

# login plugins

Login plugins such as
[accountdown-basic](https://npmjs.org/package/accountdown-basic)
should export a single function that will be created with `db` and `prefix`
arguments and should return an object with `.verify()` and `.create()`
functions:

``` js
module.exports = function (db, prefix) {
    return {
        verify: function (creds, cb) {
            // calls cb(err, success, id)
        },
        create: function (id, creds) {
            // returns an array of batch rows
        }
    };
};
```

## plugin.verify(creds, cb)

Check whether `creds` are valid login credentials.
`cb(err, success, id)` fires with any errors, the success as a boolean, and the
user `id`.

## plugin.create(id, creds)

Return an array of rows to batch insert if and only if all the keys do not
already exist using
[level-create-batch](https://npmjs.org/package/level-create-batch).


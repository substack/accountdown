# accountdown

manage accounts with leveldb

[![build status](https://secure.travis-ci.org/substack/accountdown.png)](http://travis-ci.org/substack/accountdown)

# example

## create

To create a user, we can just do:

``` js
var accountdown = require('accountdown');
var level = require('level');
var db = level('./users.db');

var users = accountdown(db, {
    login: { basic: require('accountdown-basic') }
});

var opts = {
    login: { basic: { username: 'substack', password: 'beep boop' } },
    value: { bio: 'beep boop' }
};
users.create('substack', opts, function (err) {
    if (err) return console.error(err);
});
```

The string we gave to `users.create()` need not necessarily match the `username`
credential. You might want to use a `uid` integer for example. In either case
you will get implicitly encforced unique names because if a username already
exists the `users.create()` call will fail even if the `id` is available and
likewise if an `id` is unavailable but a username is available.

## verify

To verify a credential (in this case, using accountdown-basic):

``` js
var accountdown = require('accountdown');
var level = require('level');
var db = level('./users.db');

var users = accountdown(db, {
    login: { basic: require('accountdown-basic') }
});

var creds = { username: 'substack', password: 'beep boop' };
users.verify('basic', creds, function (err, ok, id) {
    if (err) return console.error(err)
    console.log('ok=', ok);
    console.log('id=', id);
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

## users.verify(type, creds, cb)

Challenge credentials `creds` for a login `type`.

`cb(err, ok, id)` fires with an error or the boolean verify status `ok` - true
for challenge success and false for challenge failure. On success, the `id`
associated with challenge credentials, `cred` is defined.

## users.list()

Return a readable object stream of row objects with `row.key` set to the user id
of each user in the account system.

## users.get(id, cb)

Get the value for a username by `id` as `cb(err, value)`.

## users.put(id, value, cb)

Put a `value` for a username `id`. The username `id` must already exist.

`cb(err)` fires with any errors.

## users.remove(id, cb)

Remote an account by `id`, including all login information for that user id.

`cb(err)` fires with any errors.

## users.register(type, plugin)

Register a login `plugin` at a string name `type`.

## users.addLogin(id, type, creds, cb)

Add a login for `id` of `type` using the credentials `creds`.

`cb(err)` fires with any errors.

## var s = users.listLogin(id)

Return a readable object stream `s` of rows with `row.key` set to each string
login type present for the user at `id`. For example:

```
{ key: 'basic' }
{ key: 'rsa' }
```

## users.removeLogin(id, type, cb)

Remove a login for `id` by its `type`.

`cb(err)` fires with any errors.

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

# install

With [npm](https://npmjs.org) do:

```
npm install accountdown
```

# license

MIT

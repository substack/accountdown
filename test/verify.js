var accountdown = require('../');
var test = require('tape');
var level = require('level-test')();
var through = require('through2');
var db = level('verify-' + Math.random());

var params = {
    substack: {
        login: { basic: { username: 'substack', password: 'beep boop' } },
        value: { bio: 'beep boop' }
    },
    trex: {
        login: { basic: { username: 'trex', password: 'dinoking' } },
        value: { bio: 'rawr' }
    },
    cow: {
        login: { basic: { username: 'cow', password: 'moo' } },
        value: { bio: 'moo' }
    },
    xyz: {
        login: { basic: { username: 'xyz', password: '...' } },
        value: { bio: 'what' }
    }
};

test('verify', function (t) {
    t.plan(16);
    
    var users = accountdown(db, {
        login: { basic: require('accountdown-basic') }
    });
    
    var pending = 4;
    users.create('substack', params.substack, onerror);
    users.create('trex', params.trex, onerror);
    users.create('cow', params.cow, onerror);
    users.create(555, params.xyz, onerror);
    
    function onerror (err) {
        t.ifError(err);
        if (-- pending === 0) check();
    }
    
    function check () {
        users.verify(
            'basic', { username: 'substack', password: 'beep boop' },
            function (err, ok, id) {
                t.ifError(err);
                t.equal(ok, true);
                t.equal(id, 'substack');
            }
        );
        users.verify(
            'basic', { username: 'trex', password: 'dinoking' },
            function (err, ok, id) {
                t.ifError(err);
                t.equal(ok, true);
                t.equal(id, 'trex');
            }
        );
        users.verify(
            'basic', { username: 'trex', password: 'hey' },
            function (err, ok, id) {
                t.ifError(err);
                t.equal(ok, false);
                t.equal(id, 'trex');
            }
        );
        users.verify(
            'basic', { username: 'xyz', password: '...' },
            function (err, ok, id) {
                t.ifError(err);
                t.equal(ok, true);
                t.equal(id, 555);
            }
        );
    }
});

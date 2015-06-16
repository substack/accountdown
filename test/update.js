var accountdown = require('../');
var test = require('tape');
var level = require('level-test')();
var db = level('update-' + Math.random());

var params = {
  substack: {
    login: { basic: { username: 'substack', password: 'beep boop' } },
    value: { bio: 'beep boop' }
  },
  trex: {
    login: { basic: { username: 'sharptooth', password: 'dinoking' } },
    value: { bio: 'rawr' }
  }
};

test('update', function (t) {
  t.plan(16);

  var users = accountdown(db, {
    login: { basic: require('accountdown-basic') }
  });

  var pending = 2;
  users.create('substack', params.substack, onerror);
  users.create('trex', params.trex, onerror);

  function onerror (err) {
    t.ifError(err);
    if (-- pending === 0) check();
  }

  function check () {
    // Test case when password has changed.
    users.update(
      'substack', {
        login: {
          basic: {
            username: 'substack',
            password: 'pee poop' // new password is defined here
          }
        }
      },
      function (err) {
        t.ifError(err);
        users.verify('basic', {
            username: 'substack',
            password: 'pee poop'
          },
          function (err, ok, id) {
            t.ifError(err);
            t.equal(ok, true);
            t.equal(id, 'substack');
          }
        );
        users.verify('basic', {
            username: 'substack',
            password: 'beep boop'
          },
          function (err, ok, id) {
            t.ifError(err);
            t.equal(ok, false);
            t.equal(id, 'substack');
          })
      });
    // Test case when username and id are different.
    users.update(
      'trex', {
        login: {
          basic: {
            username: 'sharptooth',
            password: 'dinoMight'
          }
        }
      },
      function (err) {
        t.ifError(err);
        users.verify('basic', {
            username: 'sharptooth',
            password: 'dinoMight'
          },
          function (err, ok, id) {
            t.ifError(err);
            t.equal(ok, true);
            t.equal(id, 'trex');
          }
        );
        users.verify('basic', {
            username: 'sharptooth',
            password: 'dinoking'
          },
          function (err, ok, id) {
            t.ifError(err);
            t.equal(ok, false);
            t.equal(id, 'trex');
          })
      });
  }
});

var async = require('async');
var selenium = require('selenium-standalone');
var Xvfb = require('xvfb');
var xvfb = new Xvfb({
  displayNum: 99,
  reuse: true,
  xvfb_args: ['-screen', '0', '2880x1800x24']
});

exports.boot = function (finished) {

  async.waterfall([

    // 1st. Start Xvfb
    function (done) {
      xvfb.start(function(err){
        return done(err);
      });
    },

    // 2nd. Install Selenium
    function (done) {
      selenium.children = [];
      selenium.install({
        logger: function (message) { 
          console.log('Selenium install:', message);
        }
      }, function(err){
        return done(err);
      });
    },

    // 3rd. Start Selenium Grid
    function (done) {
      startSelenium(selenium, ['-role', 'hub', '-timeout', '100'], done);
    },

    // 4th. Start Selenium Nodes
    function (selenium, done) {

      // Ideal amount of Selenium Grid nodes on an Amazon m3.large instance
      var maxNodes = 6;

      async.times(maxNodes, function(n, next){

        var args = ['-role', 'node', '-hub', 'http://localhost:4444/grid/register', '-maxSession', '1'];
        var port = '555' + n;
        args.push('-port');
        args.push(port);

        startSelenium(selenium, args, next);

      }, function(){
        return done(null, selenium);
      });

    }

  ], function (err) {

    if (err) {
      console.log('Selenium startup error:', err);
    }
    else {
      console.log('Selenium listening!');
    }

    if (finished) {
      return finished();
    }

  });

};

function startSelenium(selenium, args, started) {

  selenium.start({
    seleniumArgs: args
  }, function (err, child) {

    if (err) {
      return started(err);
    }

    child.stderr.on('data', function(data){
      console.log(data.toString());
    });

    selenium.children.push(child);

    return started(null, selenium);

  });

};

function kill() {

  if (selenium && selenium.children) {

    for (var i = 0; i < selenium.children.length; i++) {
      console.log('Killing selenium with PID:', selenium.children[i].pid);
      selenium.children[i].kill();
    };

  }

  if (xvfb) {
    console.log('Killing xvfb');
    xvfb.stopSync();
  }

};

exports.kill = kill;

process.on('SIGINT', function(){
  console.log('Process SIGINT');
  kill();
});

process.on('SIGTERM', function(){
  console.log('Process SIGTERM');
  kill();
});

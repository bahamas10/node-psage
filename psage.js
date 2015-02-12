#!/usr/bin/env node
/**
 * psage
 *
 * Show running processes sorted by start time showing how long ago they were created
 *
 * Author: Dave Eddy <dave@daveeddy.com>
 * Date: 2/8/2013
 */

var fs = require('fs');
var path = require('path');

var destruct = require('destruct');
var relativedate = require('relative-date');
var yatf = require('yatf');

var files = fs.readdirSync('/proc');
var psinfos = 'iiiiiiiiiiIiiiiSSa8a8a8Z16Z80iiIIaa3iiiiii';
var HEADERS = ['TIME', 'PID', 'CREATED', 'ARGS'];

process.on('exit', finish);

// loop the processes and stat them
var processes = {};
files.forEach(function(pid) {
  processes[pid] = {};

  // get the inode info for the proc structure
  var filename = path.join('/proc', pid);
  fs.stat(filename, function(err, stat) {
    if (err) return;
    stat.filename = filename;
    processes[pid].stat = stat;
  });

  // grab the psinfo struct
  var psinfofile = path.join('/proc', pid, 'psinfo');
  fs.readFile(psinfofile, function(err, buf) {
    if (err) return;
    processes[pid].psinfo = destruct.unpack(psinfos, buf);
  });
});

// sort and print the results, called when process is done
function finish() {
  var ret = [];
  Object.keys(processes).forEach(function(pid) {
    processes[pid].pid = pid;
    ret.push(processes[pid]);
  });

  ret.sort(sort);
  var data = [];
  ret.forEach(function(p) {
    var stat = p.stat || {};
    var mtime = stat.mtime || 'unknown';
    data.push([
      stat.mtime.toISOString().cyan,
      p.pid.magenta,
      (relativedate(mtime) || 'unknown').yellow,
      p.psinfo ? p.psinfo[21] : 'error'.red
    ]);
  });
  yatf(HEADERS, data, {underlineHeaders: true});
}

function sort(a, b) {
  var mtime = a.stat && a.stat.mtime;
  mtime = mtime || Infinity;
  return a.stat.mtime < b.stat.mtime ? -1 : 1;
}

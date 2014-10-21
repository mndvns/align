/**
 * Module dependencies
 */

var fs = require('fs');
var isData = require('is-data');
var type = require('component-type');
var Batch = require('batch');

/**
 * Expose `readFiles`
 */

module.exports = readFiles;

/**
 * Read `files`, merging into single json
 * value.
 * @param {Array} files
 * @param {Function} cb
 */

function readFiles(files, cb){
  var batch = new Batch;

  files.forEach(function(arg, i){
    batch.push(function(done){
      fs.readFile(arg, 'utf8', function(err, data){
        var base = arg.split('/').slice(-1)[0];
        var ext = base.split('.').slice(-1)[0];
        var type = (ext || base);

        if (type === 'Makefile') type = 'make'
        if (type === 'dotfile') type = 'ini'

        data = isData(arg, type).data;
        done(null, [arg, data]);
      });
    });
  });

  batch.end(function(err, data){
    if (err) return cb(err);
    finish(data, cb);
  });
};

function finish(decoded, cb){
  var cached = {};
  var mismatches = {};
  var processed = {};

  merge(decoded, cached, mismatches, processed);

  var errors = handleMismatches(mismatches);
  if (errors) return cb(errors);

  return cb(null, processed);
}

function handleMismatches(mismatches){
  if (!Object.keys(mismatches).length) return;
  var err = new Error();
  err.type = 'mismatch';
  err.message = '';
  for (var k in mismatches) {
    var arr = mismatches[k];
    err.fileName = arr[0].path;
    err.message = '';
    err.message += 'key \'' + arr[0].value + '\' in ';
    err.message += arr[0].path + ' does not match \''
    err.message += arr[1].value + '\' in ' + arr[1].path;
  }
  return err;
}

function merge(decoded, cached, mismatches, processed) {
  cached = cached || {};
  processed = processed || {};
  mismatches = mismatches || {};
  for (var i = decoded.length - 1; i >= 0; i--) {
    var path = decoded[i][0];
    var data = decoded[i][1];
    var keys = Object.keys(data);
    for (var ii = 0, ll = keys.length; ii < ll; ii++) {
      var key = keys[ii];
      var val = data[key];
      var buf = cached[key] || {};
      var obj = {};
      obj.value = val;
      obj.path = path;
      if (type(buf.value) === 'string' && buf.value !== val) {
        mismatches[key] = (mismatches[key] || [buf]).concat(obj);
      } else if (type(obj.value) === 'array') {
        obj.value = unique(val.concat(buf.value || []));
      }
      cached[key] = obj;
      processed[key] = obj.value;
    }
  }
  return processed;
}

function unique(arr){
  var result = [], len = arr.length;
  if (!len) return result;
  result.push(arr[0]);
  for (var i = 1; i < len; ++i) if (!contains(result, arr[i])) result.push(arr[i]);
  return result;
}

function contains(arr, el){
  if ('string' === typeof arr) return !!~arr.indexOf(el)
  var i = 0, len = arr.length;
  while (i < len) if (el === arr[i++]) return true;
  return false;
}

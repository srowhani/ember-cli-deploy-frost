/* jshint node: true */

var Promise = require('ember-cli/lib/ext/promise')
var exec = require('child_process').exec

function run(command, args, opts, handle) {
  return new Promise((resolve, reject) => {
    exec(`${command} ${args.join(' ')}`, opts, function (err, out, stderr) {
      err ? reject(err, out, stderr) : resolve(out)
    })
  })
}

module.exports = run

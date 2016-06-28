/* jshint node: true */

var Promise = require('ember-cli/lib/ext/promise')
var exec = require('child_process').exec

function run(command, args, opts, handle) {
  return new Promise((resolve, reject) => {
    exec(`${command} ${args.join(' ')}`, opts, function (err, out, stderr) {
      if (err) {
        reject([err.cmd, out, stderr].join('\n'))
      } else {
        resolve(out)
      }
    })
  })
}

module.exports = run

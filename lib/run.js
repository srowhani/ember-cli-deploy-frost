/* jshint node: true */

var Promise = require('ember-cli/lib/ext/promise')
var exec = require('child_process').exec

function run(command, args, opts) {
  return new Promise((resolve, reject) => {
    exec(`${command} ${args.join(' ')}`, (err, out) => {
      err ? reject(err) : resolve(out)
    })
  })
}

module.exports = run

/* jshint node: true */

var Promise = require('ember-cli/lib/ext/promise')
var spawn = require('child_process').spawn

function run(command, args, opts) {
  return new Promise(function(resolve, reject) {
    try {
      var p = spawn(command, args, opts || {})
      var stderr = ''
      var stdout = ''
      p.stdout.on('data', function(output) {
        stdout += output
      })
      p.stderr.on('data', function(output) {
        stderr += output
      })
      p.on('close', function(code) {
        if (code !== 0) {
          var err = new Error(command + " " + args.join(" ") + " exited with nonzero status")
          err.stderr = stderr
          err.stdout = stdout
          reject(err)
        } else {
          resolve({
            stdout: stdout,
            stderr: stderr
          })
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = run

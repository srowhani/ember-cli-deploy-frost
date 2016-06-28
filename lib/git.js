/* jshint node: true */

var fs = require('fs')
var RSVP = require('rsvp')
var run = require('./run')
var stat = RSVP.denodeify(fs.stat)
var copy = RSVP.denodeify(require('ncp').ncp)

function supportsWorktree() {
  return run('git', ['help', 'worktree']).then(function() {
    return true
  }, function() {
    return false
  })
}

function prepareTree(targetDir, myRepo, repo, branch) {
  return stat(targetDir).then(function() {
    return run('git', ['reset', '--hard'], {
      cwd: targetDir
    }).then(function() {
      return run("git", ["pull"], {
        cwd: targetDir
      })
    })
  }, function(err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
    return supportsWorktree().then(function(useWorktree) {
      if (useWorktree && myRepo === repo) {
        return run("git", ["worktree", "prune"]).then(function() {
          return run("git", ["worktree", "add", targetDir, branch])
        })
      } else {
        return run("git", ["clone", repo, targetDir, '--branch', branch])
      }
    })
  })
}

function replaceTree(targetDir, ourDir, commitMessage) {
  return run("git", ["rm", "--ignore-unmatch", "-r", "."], {
    cwd: targetDir
  }).then(function() {
    return copy(ourDir, targetDir, {
      stopOnErr: true
    })
  }).then(function() {
    return run('git', ['add', '-A'], {
      cwd: targetDir
    })
  }).then(function() {
    return run('git', ['commit', '-m', `"${commitMessage || 'deploy'}"`], {
      cwd: targetDir
    }).catch(function(error) {
      if (/nothing to commit/.test(error.out)) {
        console.log('Nothing to commit...')
        return false
      }
      throw error
    })
  }).then(function() {
    return true
  })
}

function push(targetDir, repo, branch, force) {
  return run('git', ['push', force, repo, branch], {
    cwd: targetDir
  })
}

function origin(targetDir) {
  return run("git", ["remote", "-v"], {
    cwd: targetDir
  }).then(function(output) {
    var m = /origin\s+(\S+)/.exec(output)
    if (m) {
      return m[1]
    }
  })
}

exports.prepareTree = prepareTree
exports.replaceTree = replaceTree
exports.push = push
exports.origin = origin

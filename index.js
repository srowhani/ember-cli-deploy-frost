/* jshint node: true */
(function(Promise, exec, path, git) {
  'use strict'
  module.exports = {
    name: 'ember-cli-deploy-gh-pages',
    createDeployPlugin: function(options) {
      let currentBranch = null
      let branch = options.branch || 'gh-pages'
      let commitMessage = options.commitMessage || `ember-cli-deploy-gh-pages: ${branch}`

      let create = `git checkout --orphan ${branch}; git commit -m "${commitMessage}"; git push -u origin ${branch}`
      return {
        name: options.name,
        setup () {
          return new Promise((resolve, reject) => {
            console.log(`Checking if branch '${branch}' already exists...`)
            exec(`git name-rev --name-only HEAD`, (err, out) => {
              if (err) reject(err)
              currentBranch = out
              exec(`git branch | grep ${branch}`, (err, out) => {
                if (err) {
                  console.log(`Creating branch '${branch} ...'`)
                  exec(create, (err, out) => {
                    err ? reject(err) : resolve(out)
                  })
                }
                resolve(out)
              })
            })
          })
        },
        configure(context) {
          return new Promise((resolve, reject) => {
            context.ui.verbose = context.config[this.name]
            var pluginConfig = context.config[this.name] || {}
            return git.origin(context.project.root).then(function(myRepo) {
              let worktreePath = pluginConfig.worktreePath || path.join(context.project.root, `../deploy-${context.project.name()}`)
              try {
                exec(`rm -rf ${worktreePath}`, (err, out) => {
                  err ? reject(err) : resolve(out)
                })
              } catch (e) {
                reject(e)
              }
              return {
                gitDeploy: {
                  myRepo,
                  repo: pluginConfig.repo || myRepo,
                  branch: pluginConfig.branch || 'gh-pages',
                  worktreePath
                }
              }
            }).then(resolve).catch(reject)
          })
        },
        upload(context) {
          return new Promise((resolve, reject) => {
            var d = context.gitDeploy
            var distDir = context.distDir || path.join(context.project.root, 'dist')
            return git.prepareTree(d.worktreePath, d.myRepo, d.repo, d.branch)
              .then(function() {
                return git.replaceTree(d.worktreePath, distDir)
              }).then(function(commit) {
                if (commit) {
                  return git.push(d.worktreePath, d.repo, d.branch)
                } else {
                  console.log("Nothing to deploy")
                }
              }).then(resolve).catch(reject)
          })
        }
      }
    }
  }
})
(
  require('ember-cli/lib/ext/promise'),
  require('child_process').exec,
  require('path'),
  require('./lib/git')
)

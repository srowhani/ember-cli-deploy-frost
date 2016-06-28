/* jshint node: true */
(function(Promise, exec, path, git) {
  'use strict'
  module.exports = {
    name: 'ember-cli-deploy-gh-pages',
    createDeployPlugin: function(options) {
      return {
        name: options.name,
        setup (context) {
          let pluginConfig = context.config[this.name] || {}

          let branch = pluginConfig.branch || 'gh-pages'
          let commitMessage = pluginConfig.commitMessage || `ember-cli-deploy-gh-pages: ${branch}`

          let create = `git checkout --orphan ${branch}; git commit -m "${commitMessage}"; git push -u origin ${branch}`
          return new Promise((resolve, reject) => {
            console.log(`Checking if branch '${branch}' already exists...`)
            exec(`git name-rev --name-only HEAD`, (err, currentBranch) => {
              if (err) reject(err)

              exec(`git branch | grep ${branch}`, (err, out) => {
                if (err) {
                  console.log(`Creating branch '${branch} ...'`)
                  exec(`${create}; git checkout ${currentBranch}`, (err, out) => {
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
            var pluginConfig = context.config[this.name] || {}
            context.ui.verbose = pluginConfig.verbose
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
                  worktreePath,
                  commitMessage: pluginConfig.commitMessage,
                  force: pluginConfig.force ? '-f' : ''
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
                return git.replaceTree(d.worktreePath, distDir, d.commitMessage).catch(reject)
              }).then(function(commit) {
                if (commit) {
                  if (d.force)
                    console.log(`Force pushing to ${d.branch}`)
                  return git.push(d.worktreePath, d.repo, d.branch, d.force).catch(reject)
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

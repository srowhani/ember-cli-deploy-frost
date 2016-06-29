/* jshint node: true */
(function(Promise, exec, path, git) {
  'use strict'
  var DeployPluginBase = require('ember-cli-deploy-plugin');
  module.exports = {
    name: 'ember-cli-deploy-gh-pages',
    createDeployPlugin: function(options) {
      let Plugin = DeployPluginBase.extend({
        name: options.name,
        setup (context) {
          let pluginConfig = context.config[this.name] || {}
          let branch = pluginConfig.branch || 'gh-pages'
          let commitMessage = pluginConfig.commitMessage || 'Deploy'

          let create = `git checkout --orphan ${branch}; git commit -m "${commitMessage}"; git push -u origin ${branch}`
          return new Promise((resolve, reject) => {
            this.log(`Checking if branch '${branch}' already exists...`, {color:'yellow'})
            exec(`git name-rev --name-only HEAD`, (err, currentBranch) => {
              if (err) reject(err)

              exec(`git branch | grep ${branch}`, (err, out) => {
                if (err) {
                  this.log(`Creating branch '${branch} ...'`, {color: 'yellow'})
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
            let branch = pluginConfig.branch || 'gh-pages'
            let commitMessage = pluginConfig.commitMessage || 'Deploy'
            context.ui.verbose = pluginConfig.verbose
            return git.origin(context.project.root).then(function(myRepo) {
              let worktreePath = pluginConfig.worktreePath || path.join(context.project.root, `../deploy-${context.project.name()}`)
              exec(`rm -rf ${worktreePath}`, (err, out) => {
                if (err) reject(err)
              })
              return {
                gitDeploy: {
                  myRepo,
                  repo: pluginConfig.repo || myRepo,
                  branch,
                  worktreePath,
                  commitMessage: pluginConfig.commitMessage,
                  force: pluginConfig.force ? '-f' : ''
                }
              }
            }).then(resolve).catch(reject)
          })
        },
        upload(context) {
          var pluginConfig = context.config[this.name] || {}

          return new Promise((resolve, reject) => {
            var d = context.gitDeploy
            var distDir = context.distDir || path.join(context.project.root, 'dist')
            return git.prepareTree(d.worktreePath, d.myRepo, d.repo, d.branch)
              .then(() => {
                return git.replaceTree(d.worktreePath, distDir, d.commitMessage).catch(reject)
              }).then((commit) => {
                if (commit) {
                  if (d.force)
                    this.log(`Force pushing to ${d.branch}`, {color: 'yellow'})
                  return git.push(d.worktreePath, d.repo, d.branch, d.force).catch(reject)
                }
              }).then(resolve).catch(reject)
          })
        }
      })
      return new Plugin
    }
  }
})
(
  require('ember-cli/lib/ext/promise'),
  require('child_process').exec,
  require('path'),
  require('./lib/git')
)

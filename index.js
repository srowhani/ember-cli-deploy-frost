/* jshint node: true */
(function(Promise, exec, path, git, Slack) {
  'use strict'
  var DeployPluginBase = require('ember-cli-deploy-plugin');
  module.exports = {
    name: 'ember-cli-deploy-gh-pages',
    createDeployPlugin: function(options) {
      let slack = null
      let pluginConfig = {}
      let Plugin = DeployPluginBase.extend({
        name: options.name,
        configure(context) {
          return new Promise((resolve, reject) => {
            pluginConfig = context.config[this.name] || {}
            pluginConfig.branch = pluginConfig.branch || 'gh-pages'
            pluginConfig.commitMessage = pluginConfig.commitMessage || 'Deploy'
            if (pluginConfig.slack && pluginConfig.slack.webhookURL) {
              slack = new Slack(pluginConfig.slack.webhookURL, pluginConfig.slack.options)
            }
            let branch = pluginConfig.branch
            let commitMessage = pluginConfig.commitMessage
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
        setup(context) {
          let create = `git checkout --orphan ${pluginConfig.branch}; git commit -m "${pluginConfig.commitMessage}"; git push -u origin ${pluginConfig.branch}`
          return new Promise((resolve, reject) => {
            this.log(`Checking if branch '${pluginConfig.branch}' already exists...`, {
              color: 'yellow'
            })
            exec(`git name-rev --name-only HEAD`, (err, currentBranch) => {
              if (err) reject(err)

              exec(`git branch | grep ${pluginConfig.branch}`, (err, out) => {
                if (err) {
                  this.log(`Creating branch '${pluginConfig.branch} ...'`, {
                    color: 'yellow'
                  })
                  exec(`${create}; git checkout ${currentBranch}`, (err, out) => {
                    err ? reject(err) : resolve(out)
                  })
                }
                resolve(out)
              })
            })
          })
        },
        upload(context) {
          var pluginConfig = context.config[this.name] || {}
          return new Promise((res, rej) => {
            return new Promise((resolve, reject) => {
              var d = context.gitDeploy
              var distDir = context.distDir || path.join(context.project.root, 'dist')
              let s = pluginConfig.slack || {}
              return git.prepareTree(d.worktreePath, d.myRepo, d.repo, d.branch)
                .then(() => {
                  return git.replaceTree(d.worktreePath, distDir, d.commitMessage).catch(reject)
                }).then((commit) => {
                  if (commit) {
                    if (d.force)
                      this.log(`Force pushing to ${d.branch}`, {
                        color: 'yellow'
                      })
                    return git.push(d.worktreePath, d.repo, d.branch, d.force).catch(reject)
                  }
                }).then(resolve).catch(reject)
            }).then((out) => {
              slack.notify({
                attachments: [{
                  "fallback": "Success",
                  "pretext": "Successful build!",
                  "color": "good",
                  "fields": [{
                    "title": "Build completed.",
                    "value": s.successMessage || `Succesfully built to branch ${d.branch}`,
                    "short": false
                  }]
                }]
              }, () => {
                res(out)
              })
            }).catch((err) => {
              slack.notify({
                mrkdwn: true,
                attachments: [{
                  "fallback": "Deployment failed!",
                  "pretext": "Deployment failed!",
                  "color": "danger",
                  "fields": [{
                    "title": "Failure",
                    "value": `Unable to deploy.`,
                    "short": false
                  }]
                }, {
                  "color": "danger",
                  "text": `\`\`\`${err}\`\`\``,
                  "mrkdwn_in": ["text"]
                }]
              }, () => {
                rej(err)
              })
            })
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
  require('./lib/git'),
  require('node-slackr')
)

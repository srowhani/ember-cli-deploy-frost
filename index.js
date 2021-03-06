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
            let s = pluginConfig.slack || {}
            s.options = s.options || {}
            if (s && s.webhookURL && s.options.channel) {
              slack = new Slack(s.webhookURL, s.options)
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
            this.log(`Getting current branch name`, {
              color: 'yellow'
            })
            exec(`git name-rev --name-only HEAD`, (err, currentBranch) => {
              if (err) reject(err)
              this.log(`Checking if branch '${pluginConfig.branch}' already exists...`, {
                color: 'yellow'
              })
              exec(`git branch | grep ${pluginConfig.branch}`, (err, out) => {
                if (err) {
                  this.log(`Creating branch '${pluginConfig.branch} ...'`, {
                    color: 'yellow'
                  })
                  exec(`${create}`, (err, out) => {
                    err ? reject(err) : resolve(out)
                    this.log(`Checking out previous branch.`, {
                      color: 'yellow'
                    })
                    exec(`git checkout ${currentBranch}`, (err, out) => {
                      err ? reject(err) : resolve(out)
                    })
                  })
                }
                resolve(out)
              })
            })
          })
        },
        upload(context) {
          let pluginConfig = context.config[this.name] || {}
          let s = pluginConfig.slack || {}
          let d = context.gitDeploy
          return new Promise((res, rej) => {
            return new Promise((resolve, reject) => {
              var distDir = context.distDir || path.join(context.project.root, 'dist')
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
              slack ? slack.notify({
                attachments: [{
                  "fallback": "Success",
                  "pretext": "Successful build!",
                  "color": "good",
                  "fields": [{
                    "title": "Build completed.",
                    "value": typeof s.success  === 'function' ? s.success(d) : `Successfully built to branch ${d.branch}`,
                    "short": false
                  }]
                }]
              }, (e) => {
                e ? rej(e) : res(out)
              }) : res(out)
            }).catch((err) => {
              slack ? slack.notify({
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
                  "text": typeof s.failure === 'function' ? s.failure(d) : `\`\`\`${err}\`\`\``,
                  "mrkdwn_in": ["text"]
                }]
              }, (e) => {
                e ? rej(e) : rej(err)
              }) : rej(err)
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

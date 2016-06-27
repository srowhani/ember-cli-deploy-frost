/* jshint node: true */
(function(Promise, exec, path, git) {
  'use strict';
  module.exports = {
    name: 'ember-cli-deploy-init',
    createDeployPlugin: function(options) {
      let currentBranch = null
      let branch = options.branch || 'gh-pages'
      let create = `git checkout --orphan ${branch}; git commit -m --allow-empty; git push -u origin ${branch}`
      return {
        name: options.name,
        configure(context) {
          var pluginConfig = context.config[this.name] || {};
          return getMyRepo(context).then(function(myRepo) {
            return {
              gitDeploy: {
                myRepo: myRepo,
                repo: pluginConfig.repo || myRepo,
                branch: pluginConfig.branch || 'gh-pages',
                worktreePath: pluginConfig.worktreePath || defaultWorktree(context)
              }
            };
          }).catch(showStderr(context.ui));
        },
        upload(context) {
          var d = context.gitDeploy;
          var distDir = context.distDir || path.join(context.project.root, 'dist');
          return git.prepareTree(d.worktreePath, d.myRepo, d.repo, d.branch)
            .then(function() {
              return git.replaceTree(d.worktreePath, distDir);
            }).then(function(didCommit) {
              if (didCommit) {
                return git.push(d.worktreePath, d.repo, d.branch);
              } else {
                console.log("Nothing to deploy");
              }
            }).catch(showStderr(context.ui));
        },
        setup() {
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
        teardown() {
          return new Promise((resolve, reject) => {
            if (oldBranch)
              exec(`git checkout ${oldBranch}`, (err, out) => {
                err ? reject(err) : resolve(out)
              })
          })

        }
      }
    }
  };

  function showStderr(ui) {
    return function(err) {
      if (err.stderr) {
        ui.write(err.stderr);
      }
      throw err;
    };
  }

  function getMyRepo(context) {
    return git.origin(context.project.root);
  }

  function defaultWorktree(context) {
    return path.join(context.project.root, '../deploy-' + context.project.name());
  }
})
(
  require('ember-cli/lib/ext/promise'),
  require('child_process').exec,
  require('path'),
  require('./lib/git')
)

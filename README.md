# ember-cli-deploy-gh-pages

Make deploying to gh-pages great again!

An ember-cli-deploy plugin to build application a specified branch. Defaults to gh-pages to work right out of the box with GitHub.


Based *heavily* on [@ef4](https://github.com/ef4)'s [ember-cli-deploy-git](https://github.com/ef4/ember-cli-deploy-git).
## Config

Configuration is optional, will work fine from the box.
But for ease of access, some options are exposed

From `config/deploy.js`:

```js
ENV['gh-pages'] = {
  repo: '<repo url>', -> default : current git origin
  branch: '<branch name>', -> default :gh-pages
  worktreePath: '<path to where dist is built>', -> default :tmp/deploy-dist
  commitMessage: '<message on commit>', -> default :ember-cli-deploy-gh-pages: ${branch}
  verbose: true -> default :false
};
```
## Installation

`ember install ember-cli-deploy ember-cli-build-build ember-cli-deploy-gh-pages`

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation](http://ember-cli.github.io/ember-cli-deploy/plugins).

- `setup`
- `configure`
- `upload`

## Running

`ember deploy <deployTarget>`

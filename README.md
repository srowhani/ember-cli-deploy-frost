# ember-cli-deploy-gh-pages

Make deploying to gh-pages great again!

An ember-cli-deploy plugin to build application a specified branch. Defaults to gh-pages to work right out of the box with GitHub.


Based *heavily* on [@ef4](https://github.com/ef4)'s [ember-cli-deploy-git](https://github.com/ef4/ember-cli-deploy-git).
## Config

Configuration is optional, will work fine from the box.
But for ease of access, some options are exposed

## Installation

`ember install ember-cli-deploy ember-cli-deploy-build ember-cli-deploy-gh-pages`

A blueprint will run to generate `config/deploy.js`

From there, you will need to customize the following:

```js
ENV['gh-pages'] = {
    force: process.env.gitForcePush,
    slack: {
      webhookURL: process.env.webhookURL,
      options: {
        channel: process.env.slackChannel
      },
      success (deploy) {
        return `
          Successfully deployed to ${deploy.branch}\n
          Visit at ${process.env.demoURL}
        `;
      },
      failure (error) {
         return error;
      }
    }
  };
```

Both the `success` and `failure` hooks are optional.

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation](http://ember-cli.github.io/ember-cli-deploy/plugins).

- `setup`
- `configure`
- `upload`

## Running

`ember deploy <deployTarget>`

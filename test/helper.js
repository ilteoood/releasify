'use strict'

const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const proxyquire = require('proxyquire')

const factorySimpleGit = require('./proxy/simple-git-proxy')
const factoryOctokit = require('./proxy/octokit-proxy')
const factoryNpm = require('./proxy/npm-proxy')

function wait (ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function readFileHelp (file) {
  const help = fs.readFileSync(path.join('./man', file), 'utf8')
  return `${help}\n` // added because shell add a new line at the end
}

function execute (command, params = []) {
  const node = process.execPath
  return spawn(node, ['lib/cli', command, ...params])
}

function buildProxyCommand (commandPath, opts = {}) {
  return proxyquire(commandPath, {
    '../git-directory': proxyquire('../lib/git-directory', {
      'simple-git': factorySimpleGit(opts.git)
    }),
    '../github': proxyquire('../lib/github', {
      '@octokit/rest': factoryOctokit(opts.github)
    }),
    '../npm': proxyquire('../lib/npm', {
      'node:child_process': factoryNpm(opts.npm)
    }),
    ...opts.external
  })
}

function withResolvers () {
  let promiseResolve, promiseReject
  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })
  return { promise, resolve: promiseResolve, reject: promiseReject }
}

module.exports = {
  wait,
  readFileHelp,
  execute,
  buildProxyCommand,
  withResolvers
}

path = require 'path'

module.exports =
  config:
    executablePath:
      type: 'string'
      default: path.join __dirname, '..', 'node_modules', 'jscs', 'bin'
      description: 'Path of the `jscs` executable'
    preset:
      type: 'string'
      default: 'airbnb'
      enum: ['airbnb', 'crockford', 'google', 'grunt', 'jquery', 'mdcs', 'wikimedia', 'yandex']
    harmony:
      type: 'boolean'
      default: false
      description: 'Enable ES6 and JSX parsing syntax with `--esprima=fb-esprima` CLI option.'
    verbose:
      type: 'boolean'
      default: false
      description: 'Prepends the name of the offending rule to all error messages.'
    onlyConfig:
      type: 'boolean'
      default: false
      description: 'Disable linter if there is no config file found for the linter.'

  activate: ->
    console.log 'activate linter-jscs'

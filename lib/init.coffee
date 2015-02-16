path = require 'path'

module.exports =
  config:
    jscsExecutablePath:
      type: 'string'
      default: path.join __dirname, '..', 'node_modules', 'jscs', 'bin'
      description: 'Path of the `jscs` executable'
    preset:
      type: 'string'
      default: 'airbnb'
      enum: ['airbnb', 'crockford', 'google', 'jquery', 'mdcs', 'wikimedia', 'yandex']
    harmony:
      type: 'boolean'
      default: false
      description: 'Attempts to parse your code as ES6 using the harmony version of the esprima parser.'

  activate: ->
    console.log 'activate linter-jscs'

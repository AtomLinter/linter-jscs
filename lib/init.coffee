path = require 'path'

module.exports =
  configDefaults:
    jscsExecutablePath: path.join __dirname, '..', 'node_modules', 'jscs', 'bin'
    preset: 'jquery'
    esnext: false

  activate: ->
    console.log 'activate linter-jscs'

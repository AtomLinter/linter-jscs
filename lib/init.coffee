path = require 'path'

if process.platform is 'win32'
  jscsExecutablepath = path.join __dirname, '..', 'node_modules', 'jscs', 'bin'
else
  jscsExecutablepath = path.join __dirname, '..', 'node_modules', '.bin'

module.exports =
  configDefaults:
    jscsExecutablePath: jscsExecutablePath

  activate: ->
    console.log 'activate linter-jscs'

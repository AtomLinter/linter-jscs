path = require 'path'

module.exports =
  configDefaults:
    jscsExecutablePath: path.join __dirname, '..', 'node_modules', '.bin'
    nodeExecutablePath: path.join require.resolve('package'), '..', 'apm/node_modules/atom-package-manager/bin/node'

  activate: ->
    console.log 'activate linter-jscs'

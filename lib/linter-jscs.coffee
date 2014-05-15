linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
findFile = require "#{linterPath}/lib/util"

class LinterJscs extends Linter

  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: 'source.js'

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: 'jscs -r checkstyle'

  linterName: 'jscs'

  # A regex pattern used to extract information from the executable's output.
  regex: 'line="(?<line>[0-9]+)" column="(?<col>[0-9]+).+?message="(?<message>.+)" s'

  isNodeExecutable: yes

  constructor: (editor) ->
    super editor

    config = findFile @cwd, ['.jscsrc', '.jscs.json']
    if config
      @cmd += " -c #{config}"

    atom.config.observe 'linter-jscs.jscsExecutablePath', @formatShellCmd

  formatShellCmd: =>
    jscsExecutablePath = atom.config.get 'linter-jscs.jscsExecutablePath'
    @executablePath = jscsExecutablePath


  destroy: ->
    atom.config.unobserve 'linter-jscs.jscsExecutablePath'

module.exports = LinterJscs

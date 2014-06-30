linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
findFile = require "#{linterPath}/lib/util"

class LinterJscs extends Linter

  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: 'source.js'

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: ''

  linterName: 'jscs'

  # A regex pattern used to extract information from the executable's output.
  regex: 'line="(?<line>[0-9]+)" column="(?<col>[0-9]+).+?message="(?<message>.+)" s'

  # A string to indicate using jscs preset, not use preset if empty
  preset: ''

  # A string to indicate using jscs config
  config: ''

  isNodeExecutable: yes

  constructor: (editor) ->
    super editor

    @config = findFile @cwd, ['.jscsrc', '.jscs.json']
    console.log "Use JSCS config file [#{@config}]" if atom.inDevMode()

    @buildCmd()

    atom.config.observe 'linter-jscs.jscsExecutablePath', @formatShellCmd
    atom.config.observe 'linter-jscs.preset', @updatePreset

  formatShellCmd: =>
    jscsExecutablePath = atom.config.get 'linter-jscs.jscsExecutablePath'
    @executablePath = jscsExecutablePath

  updatePreset: (preset) =>
    @preset = preset
    console.log "Use JSCS preset [#{@preset}]" if atom.inDevMode()
    @buildCmd()

  buildCmd: =>
    @cmd = 'jscs -r checkstyle'
    @cmd = "#{@cmd} -c \"#{@config}\"" if @config
    @cmd = "#{@cmd} -p #{@preset}" if @preset and not @config

  destroy: ->
    atom.config.unobserve 'linter-jscs.jscsExecutablePath'

module.exports = LinterJscs

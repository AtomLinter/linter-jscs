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
    @config = @jscsConf() unless @config
    console.log "Use JSCS config file [#{@config}]" if atom.inDevMode()

    @buildCmd()

    atom.config.observe 'linter-jscs.jscsExecutablePath', @formatShellCmd
    atom.config.observe 'linter-jscs.preset', @updatePreset
    atom.config.observe 'linter-jscs.harmony', @updateHarmony

  jscsConf: =>
    pkgConf = findFile @cwd, "package.json"
    if pkgConf
      console.log 'found', pkgConf
      try
        return pkgConf if typeof require(pkgConf).jscsConfig is 'object'
      catch e then return

  formatShellCmd: =>
    jscsExecutablePath = atom.config.get 'linter-jscs.jscsExecutablePath'
    @executablePath = jscsExecutablePath

  updatePreset: (preset) =>
    @preset = preset
    console.log "Use JSCS preset [#{@preset}]" if atom.inDevMode()
    @buildCmd()

  updateHarmony: (harmony) =>
    @harmony = harmony
    console.log "Using harmony `--esnext`" if atom.inDevMode()
    @buildCmd()

  buildCmd: =>
    @cmd = 'jscs -r checkstyle'
    @cmd = "#{@cmd} --esnext" if @harmony
    @cmd = "#{@cmd} -c #{@config}" if @config
    @cmd = "#{@cmd} -p #{@preset}" if @preset and not @config

  formatMessage: (match) ->
    match.message

  destroy: ->
    atom.config.unobserve 'linter-jscs.jscsExecutablePath'
    atom.config.unobserve 'linter-jscs.preset'
    atom.config.unobserve 'linter-jscs.harmony'

module.exports = LinterJscs

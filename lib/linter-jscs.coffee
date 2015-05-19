path = require 'path'

{CompositeDisposable} = require 'atom'

linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
findFile = require "#{linterPath}/lib/util"

class LinterJscs extends Linter

  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: ['source.js', 'source.js.jsx']

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: ''

  linterName: 'jscs'

  # A regex pattern used to extract information from the executable's output.
  regex: 'line="(?<line>[0-9]+)" column="(?<col>[0-9]+)" severity="(?<level>.+)".+?message="(?<message>.+)" s'

  # A string to indicate using jscs preset, not use preset if empty
  preset: ''

  # A string to indicate using jscs config
  config: ''

  # A string to setup type of message (don't understand why default isn't work)
  defaultLevel: atom.config.get 'linter-jscs.messageType' or 'info'

  isNodeExecutable: yes

  options: ['executablePath', 'preset', 'harmony', 'verbose', 'onlyConfig']

  constructor: (editor) ->
    super editor

    @disposables = new CompositeDisposable

    # Find the nearest possible config file
    @config = findFile @cwd, ['.jscsrc', '.jscs.json', 'package.json']
    # We need to check if the config file is `package.json`
    # it's a specific object on this config file that we need
    if (@config?.split?(path.sep)[@config?.split?(path.sep).length - 1]) is 'package.json'
      # Check that we have an `jscsConfig` object on `package.json`
      # Or we will try to search for `.jscsrc` and `.jscs.json` only
      try
        throw new Error if typeof require(@config)?.jscsConfig? isnt 'object'
      catch
        # Try to find the nearest `.jscsrc` or `.jscs.json`
        # if there's an error while requiring the file
        # or if the `jscsConfig` isnt existing
        @config = findFile @cwd, ['.jscsrc', '.jscs.json']
    console.log "Use JSCS config file [#{@config}]" if atom.inDevMode()

    # Load options from linter-jscs
    for option in @options
      @disposables.add atom.config.observe "linter-jscs.#{option}", @updateOption.bind(this, option)

  updateOption: (option) =>
    @[option] = atom.config.get "linter-jscs.#{option}"
    console.log "Updating `linter-jscs` #{option} to #{@[option]}" if atom.inDevMode()
    @buildCmd()

  buildCmd: =>
    @cmd = 'jscs -r checkstyle'
    @cmd = "#{@cmd} --verbose" if @verbose
    @cmd = "#{@cmd} --esprima=esprima-fb" if @harmony
    @cmd = "#{@cmd} -c #{@config}" if @config
    @cmd = "#{@cmd} -p #{@preset}" if @preset and not @config

  lintFile: (path, next) =>
    condition = (@config and @onlyConfig) or !@onlyConfig
    path = if condition then path else path: ''

    super path, next

  destroy: ->
    @disposables.dispose()

module.exports = LinterJscs

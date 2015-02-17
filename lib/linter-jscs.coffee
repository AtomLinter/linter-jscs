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
  regex: 'line="(?<line>[0-9]+)" column="(?<col>[0-9]+).+?message="(?<message>.+)" s'

  # A string to indicate using jscs preset, not use preset if empty
  preset: ''

  # A string to indicate using jscs config
  config: ''

  isNodeExecutable: yes

  options: ['executablePath', 'preset', 'harmony', 'verbose']

  constructor: (editor) ->
    super editor

    @config = findFile @cwd, ['.jscsrc', '.jscs.json']
    console.log "Use JSCS config file [#{@config}]" if atom.inDevMode()

    # Load options from linter-jscs
    for option in @options
      atom.config.observe "linter-jscs.#{option}", @updateOption.bind(@, option)

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

  formatMessage: (match) ->
    match.message

  destroy: ->
    for option in @options
      atom.config.unobserve "linter-jscs.#{option}"

module.exports = LinterJscs

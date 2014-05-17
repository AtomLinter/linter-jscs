{parseString} = require 'xml2js'

{Range} = require 'atom'

linterPath = atom.packages.getLoadedPackage('linter').path
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

  processMessage: (xml, callback) ->
    parseString xml, (err, messagesUnprocessed) =>
      return err if err
      messages = messagesUnprocessed.checkstyle.file[0].error?.map (message) =>
        message: message.$.message
        line: message.$.line
        col: message.$.column
        range: new Range([message.$.line - 1, message.$.column], [message.$.line, 0])
        level: message.$.severity
        linter: @linterName
      callback? messages if messages?

  destroy: ->
    atom.config.unobserve 'linter-jscs.jscsExecutablePath'

module.exports = LinterJscs

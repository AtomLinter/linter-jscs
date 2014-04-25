/* global atom */
'use strict';

var path = require('path');
var tmp = require('temporary');
var RSVP = require('RSVP');
var exec = require('child_process').exec;
var extend = require('extendonclass').extendOnClass;

var linterPath = path.join(atom.packages.getLoadedPackage('linter').path, 'lib/linter');
var Linter = require(linterPath);

// Create `extend` ala BackBone to use the CoffeeScript class
// within plain and old JavaScript, yeah I prefere JS!
// see: https://github.com/bevry/extendonclass
Linter.extend = extend;

var JSCSLinter = Linter.extend({
  linterName: 'jscs',
  regex: 'line="(?<line>[0-9]+)"',
  cmd: 'jscs -c ~/.jscs.json -r checkstyle',

  constructor: function (editorView) {
    this.editorView = editorView;
    this.executablePath = path.join(__dirname, '..', 'node_modules', '.bin');
  },

  // Needed to over-ride this function,
  // on from parent is not working with jscs linter
  lintFile: function (filePath, callback) {
    var self = this;
    var file = this.getEditorText();
    exec(this.getCmd(file.path), function (err, stdout, stderr) {
      if (err) {
        console.log(err);
      }
      return self.processMessage(stdout, stderr);
    });
  },

  getEditorText: function () {
    var data = this.editorView.getText();
    var file = new tmp.File();
    file.writeFileSync(data);
    return file;
  }
});

JSCSLinter.syntax = [
  'source.js',
  'source.js.jquery',
  'text.html.basic'
];

module.exports = JSCSLinter;

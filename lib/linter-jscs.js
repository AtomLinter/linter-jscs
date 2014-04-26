/* global atom */
'use strict';

var fs = require('fs');
var path = require('path');
var tmp = require('temporary');
var exec = require('child_process').exec;
var extend = require('extendonclass').extendOnClass;

var linterPath = path.join(atom.packages.getLoadedPackage('linter').path, 'lib/linter');
var Linter = require(linterPath);

// Create `extend` ala BackBone to use the CoffeeScript class
// within plain and old JavaScript, yeah I prefere JS!
// see: https://github.com/bevry/extendonclass
Linter.extend = extend;

var JSCSLinter = Linter.extend({
  linterName: 'JSCS',
  regex: 'line="(?<line>[0-9]+)" column="(?<col>[0-9]+).+?message="(?<message>.+)" s',
  cmd: 'jscs -r checkstyle',

  constructor: function (editorView) {
    // Saved editorView property on linter
    this.editorView = editorView;
    // Let's find the conf path of our `.jscs.json`
    var conf = this.getConf();
    if (conf) {
      // Set it to the cmd
      this.cmd = this.cmd + ' -c ' + conf;
    }
    // Set the executable path
    this.executablePath = path.join(__dirname, '..', 'node_modules', '.bin');
  },

  getConf: function () {
    var projectDir = atom.project.path;
    var confPath = path.join(projectDir, '.jscs.json');
    // Is there a `.jscs.json` in the project directory?
    if (fs.existsSync(confPath)) {
      return confPath;
    }
    else {
      var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
      confPath = path.join(homeDir, '.jscs.json');
      // Nevermind let's try in the home directory
      if (fs.existsSync(confPath)) {
        return confPath;
      }
      else {
        // okey no luck :(
        return false;
      }
    }
  },

  // Needed to over-ride this function,
  // on from parent is not working with jscs linter
  // because it needs a `.js` file
  lintFile: function (filePath, cb) {
    var self = this;
    // let's create our custom temp file
    var file = this.getFile();
    var cmd = this.getCmd(file.path);
    exec(cmd, function (err, stdout) {
      file.unlink();
      return self.processMessage(stdout, cb);
    });
  },

  getFile: function () {
    var data = this.editorView.getText();
    var file = new tmp.File();
    file.writeFileSync(data);
    // jscs cli wants a `.js` file only
    // so we need to rename the file
    fs.renameSync(file.path, file.path + '.js');
    file.path = file.path + '.js';
    return file;
  }
});

JSCSLinter.syntax = [
  'source.js',
  'source.js.jquery',
  'text.html.basic'
];

module.exports = JSCSLinter;

/* global atom */
'use strict';

var fs = require('fs');
var path = require('path');
var extend = require('extendonclass').extendOnClass;

var linterPath = path.join(atom.packages.getLoadedPackage('linter').path, 'lib/linter');
var Linter = require(linterPath);
var configFileNames = ['.jscsrc', '.jscs.json'];

// Create `extend` ala BackBone to use the CoffeeScript class
// within plain and old JavaScript, yeah I prefere JS!
// see: https://github.com/bevry/extendonclass
Linter.extend = extend;

var JSCSLinter = Linter.extend({
  linterName: 'JSCS',
  regex: 'line="(?<line>[0-9]+)" column="(?<col>[0-9]+).+?message="(?<message>.+)" s',
  cmd: 'jscs -r checkstyle',

  constructor: function (editor) {
    this.__proto__.__proto__.constructor.call(this, editor);
    // Let's find the conf path of our `.jscs.json`
    var conf = this.getConf();
    if (conf) {
      // Set it to the cmd
      this.cmd = this.cmd + ' -c ' + conf;
    }
    // Set the executable path from the config
    this.executablePath = atom.config.get('linter-jscs.jscsExecutablePath');
  },

  getConf: function () {
    var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    var projectDir = atom.project.path;
    var confPath, idx;
    var numConfigFileNames = configFileNames.length;

    // Is there a `.jscs.json` or `.jscsrc` in the project directory?
    for (idx = 0; idx < numConfigFileNames; idx++) {
      confPath = path.join(projectDir, configFileNames[idx]);
      if (fs.existsSync(confPath)) {
        return confPath;
      }
    }
    // Nothing found in the project directory, let's look in the home
    // directory.
    for (idx = 0; idx < numConfigFileNames; idx++) {
      confPath = path.join(homeDir, configFileNames[idx]);
      if (fs.existsSync(confPath)) {
        return confPath;
      }
    }
    // okey no luck :(
    return false;
  }
});

JSCSLinter.syntax = ['source.js'];

module.exports = JSCSLinter;

/* global atom */
'use strict';

var fs = require('fs');
var path = require('path');
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

  constructor: function () {
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
    var newFile = filePath + '.js';
    var cmd = this.getCmd(newFile);
    // Okey copy and rename the original `filePath`
    // given from `linter-view` from `Linter`
    fs.createReadStream(filePath)
      .pipe(fs.createWriteStream(newFile));
    // Run file into our jscs linter
    exec(cmd, function (err, stdout) {
      // Finished, remove the file
      fs.unlink(newFile, function () {
        // Okey, let's continue the routine
        return self.processMessage(stdout, cb);
      });
    });
  }
});

JSCSLinter.syntax = ['source.js'];

module.exports = JSCSLinter;

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
    // let's create our custom temp file
    filePath = this.getFile(filePath);
    var cmd = this.getCmd(filePath);
    exec(cmd, function (err, stdout) {
      fs.unlink(filePath, function (err) {
        if (err) {
          return console.log(err);
        }
        return self.processMessage(stdout, cb);
      });
    });
  },

  getFile: function (filePath) {
    fs.createReadStream(filePath).pipe(fs.createWriteStream(filePath + '.js'));
    filePath = filePath + '.js';
    return filePath;
  }
});

JSCSLinter.syntax = [
  'source.js',
  'source.js.jquery',
  'text.html.basic'
];

module.exports = JSCSLinter;

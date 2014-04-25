/* global atom */
'use strict';

var path = require('path');
var extend = require('extendonclass').extendOnClass;

var linterPath = path.join(atom.packages.getLoadedPackage('linter').path, 'lib/linter');
var Linter = require(linterPath);

// Create `extend` ala BackBone to use the CoffeeScript class
// within plain and old JavaScript, yeah I prefere JS!
// see: https://github.com/bevry/extendonclass
Linter.extend = extend;

var JSCSLinter = Linter.extend({
  syntax: [
    'source.js',
    'source.js.jquery',
    'text.html.basic'
  ],
  linterName: 'jscs',
  regex: 'line="(?<line>[0-9]+)" column="(?<col>[0-9]+)"',

  constructor: function () {
    this.executablePath = path.join(__dirname, '..', 'node_modules', '.bin');
    this.cmd = 'jscs -c ~/.jscs.json -r checkstyle';
    console.log(this.executablePath);
  }
});

module.exports = JSCSLinter;

'use babel';

import { Range } from 'atom';
import JSCS      from 'jscs';

export let config = {
  preset: {
    title: 'Preset',
    description: 'Preset option is ignored if a config file is found for the linter.',
    type: 'string',
    default: 'airbnb',
    enum: ['airbnb', 'crockford', 'google', 'grunt', 'jquery', 'mdcs', 'node-style-guide', 'wikimedia', 'yandex']
  },
  harmony: {
    title: 'Harmony',
    type: 'boolean',
    default: false,
    description: 'Enable ES6 and JSX parsing syntax with `--esprima=esprima-fb` CLI option.'
  },
  verbose: {
    title: 'Verbose',
    description: 'Prepends the name of the offending rule to all error messages.',
    type: 'boolean',
    default: false
  },
  onlyConfig: {
    title: 'Only Config',
    description: 'Disable linter if there is no config file found for the linter.',
    type: 'boolean',
    default: false
  },
  fixOnSave: {
    title: 'Fix on save',
    description: 'Fix JavaScript on save',
    type: 'boolean',
    default: false
  }
};

const preset      = () => atom.config.get('linter-jscs.preset');
const harmony     = () => atom.config.get('linter-jscs.harmony');
const verbose     = () => atom.config.get('linter-jscs.verbose');
const onlyConfig  = () => atom.config.get('linter-jscs.onlyConfig');
const fixOnSave   = () => atom.config.get('linter-jscs.fixOnSave');

let jscs;
let observer;
let isMissingConfig = false;

export const activate = () => {

  jscs = new JSCS();
  jscs.registerDefaultRules();

  let directory = atom.project.getDirectories().shift();
  let jscsrc    = directory ? directory.resolve('.jscsrc') : null;
  let jscsjson  = directory ? directory.resolve('.jscs.json') : null;
  let package   = directory ? directory.resolve('package.json') : null;
  let config    = jscsrc || jscsjson || package;

  let options   = {
    esnext: harmony(),
    preset: preset(),
    verbose: verbose()
  };

  if (config) {
    try {
      jscs.configure(require(jscsrc));
    } catch (e) {
      isMissingConfig = true;
      jscs.configure(options);
    }
  } else {
    jscs.configure(options);
  }

  observer = atom.workspace.observeTextEditors((editor) => {
    editor.getBuffer().onWillSave(() => {
      if (fixOnSave()) {
        fixString();
      }
    });
  });
};

export const deactivate = () => {
  observer.dispose();
};

const fixString = () => {

  let editor = atom.workspace.getActiveTextEditor();
  let path   = editor.getPath();
  let text   = editor.getText();

  if (isMissingConfig && onlyConfig()) {
    return;
  }

  editor.setText(jscs.fixString(text, path).output);
};

export const provideLinter = () => {

  return {
    grammarScopes: ['source.js', 'source.js.jsx'],
    scope: 'file',
    lintOnFly: true,
    lint: (editor) => {

      if (isMissingConfig && onlyConfig()) {
        return [];
      }

      let path   = editor.getPath();
      let text   = editor.getText();
      let errors = jscs.checkString(text, path).getErrorList();

      return errors.map((error) => {
        return {
          type: error.rule,
          text: error.message,
          filePath: error.filename,
          range: new Range(
            [error.line - 1, error.column - 1],
            [error.line - 1, error.column - 1]
          )
        }
      });
    }
  };
};

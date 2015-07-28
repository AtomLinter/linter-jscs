'use babel';

import { Range } from 'atom';
import JSCS      from 'jscs';

export default class LinterJSCS {

  static config = {
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
      description: 'Enable ES6 and JSX parsing syntax.'
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
  }

  static get preset() {
    return atom.config.get('linter-jscs.preset');
  }

  static get harmony() {
    return atom.config.get('linter-jscs.harmony');
  }

  static get verbose() {
    return atom.config.get('linter-jscs.verbose');
  }

  static get onlyConfig() {
    return atom.config.get('linter-jscs.onlyConfig');
  }

  static get fixOnSave() {
    return atom.config.get('linter-jscs.fixOnSave');
  }

  static activate() {

    this.jscs = new JSCS();
    this.jscs.registerDefaultRules();

    let directory = atom.project.getDirectories().shift();
    let jscsrc    = directory ? directory.resolve('.jscsrc') : null;
    let jscsjson  = directory ? directory.resolve('.jscs.json') : null;
    let package   = directory ? directory.resolve('package.json') : null;
    let config    = jscsrc || jscsjson || package;

    let options = {
      esnext: this.harmony,
      preset: this.preset,
      verbose: this.verbose
    };

    if (config) {
      try {
        this.jscs.configure(require(config));
      } catch (e) {
        this.isMissingConfig = true;
        this.jscs.configure(options);
      }
    } else {
      this.jscs.configure(options);
    }

    this.observer = atom.workspace.observeTextEditors((editor) => {
      editor.getBuffer().onWillSave(() => {
        if (this.fixOnSave) {
          this.fixString();
        }
      });
    });
  }

  static deactivate() {
    this.observer.dispose();
  }

  static provideLinter() {
    return {
      grammarScopes: ['source.js', 'source.js.jsx'],
      scope: 'file',
      lintOnFly: true,
      lint: (editor) => {

        if (this.isMissingConfig && this.onlyConfig) {
          return [];
        }

        let path   = editor.getPath();
        let text   = editor.getText();
        let errors = this.jscs.checkString(text, path).getErrorList();

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
  }

  static fixString() {

    let editor = atom.workspace.getActiveTextEditor();
    let path   = editor.getPath();
    let text   = editor.getText();

    if (this.isMissingConfig && this.onlyConfig) {
      return;
    }

    editor.setText(this.jscs.fixString(text, path).output);
  }
};

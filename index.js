'use babel';

import JSCS from 'jscs';
import { Range } from 'atom';
import { findFile } from 'atom-linter';

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
    },
    displayAs: {
      title: 'Display errors as',
      type: 'string',
      default: 'error',
      enum: ['error', 'warning']
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

  static get displayAs() {
    return atom.config.get('linter-jscs.displayAs');
  }

  static activate() {
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
        // We need re-initialize JSCS before every lint
        // or it will looses the errors, didn't trace the error
        // must be something with new 2.0.0 JSCS
        this.jscs = new JSCS();
        this.jscs.registerDefaultRules();

        const filePath = editor.getPath();
        const configFiles = ['.jscsrc', '.jscs.json', 'package.json'];
        const config = findFile(filePath, configFiles);

        const options = {
          esnext: this.harmony,
          preset: this.preset,
          verbose: this.verbose
        };

        if (config) {
          try {
            this.jscs.configure(require(config));

            // Don't cache config file, user can have changed
            // the configuration between two lints
            delete require.cache[require.resolve(config)];
          } catch (e) {
            // Warn user with errors in his jscs configuration
            atom.notifications
              .addWarning(
                'Error while loading `jscs` config',
                { detail: e, dismissable: true }
              );

            this.isMissingConfig = true;
            this.jscs.configure(options);
          }
        } else {
          this.jscs.configure(options);
        }

        // We don't have a config file present in project directory
        // let's return an empty array of errors
        if (this.isMissingConfig && this.onlyConfig) return [];

        const text = editor.getText();
        const errors = this.jscs
          .checkString(text, path)
          .getErrorList();

        return errors.map(({ rule, message, line, column }) => {

          // Calculate range to make the error whole line
          // without the indentation at begining of line
          const indentLevel = editor.indentationForBufferRow(line - 1);
          const startCol = editor.getTabLength() * indentLevel;
          const endCol = editor.getBuffer().lineLengthForRow(line - 1);
          const range = [[line - 1, startCol], [line - 1, endCol]];

          const type = this.displayAs;
          const html = `<span class='badge badge-flexible'>${rule}</span> ${message}`;

          return { type, html, filePath, range };
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

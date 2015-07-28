'use babel';

import JSCS from 'jscs';
import { Range } from 'atom';
import { findFile } from 'atom-linter';
import { readFileSync } from 'fs';

export default class LinterJSCS {

  static config = {
    preset: {
      title: 'Preset',
      description: 'Preset option is ignored if a config file is found for the linter.',
      type: 'string',
      default: 'airbnb',
      enum: ['airbnb', 'crockford', 'google', 'grunt', 'jquery', 'mdcs', 'node-style-guide', 'wikimedia', 'yandex']
    },
    esnext: {
      description: 'Attempts to parse your code as ES6+, JSX, and Flow using the babel-jscs package as the parser.',
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

  static get esnext() {
    return atom.config.get('linter-jscs.esnext');
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

        // Options passed to `jscs` from package configuration
        const options = { esnext: this.esnext, preset: this.preset };

        if (config) {
          try {
            const rawConfig = readFileSync(config, { encoding: 'utf8' });
            let parsedConfig = JSON.parse(rawConfig);

            if (config.indexOf('package.json') > -1) {
              if (parsedConfig.jscsConfig) {
                parsedConfig = parsedConfig.jscsConfig;
              } else {
                throw new Error('No `jscsConfig` key in `package.json`');
              }
            }

            this.jscs.configure(parsedConfig);
          } catch (e) {
            console.warn('Error while loading jscs config file');
            console.warn(e);

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
    if (!this.isMissingConfig && !this.onlyConfig) {
      const editor = atom.workspace.getActiveTextEditor();
      const path = editor.getPath();
      const text = editor.getText();

      return editor.setText(this.jscs.fixString(text, path).output);
    }
  }
};

'use babel';

import path from 'path';
import configFile from 'jscs/lib/cli-config';
import globule from 'globule';

const grammarScopes = ['source.js', 'source.js.jsx'];

export default class LinterJSCS {

  static config = {
    preset: {
      title: 'Preset',
      description: 'Preset option is ignored if a config file is found for the linter.',
      type: 'string',
      default: 'airbnb',
      enum: ['airbnb', 'crockford', 'google', 'grunt', 'idiomatic', 'jquery', 'mdcs', 'node-style-guide', 'wikimedia', 'wordpress', 'yandex'],
    },
    esnext: {
      description: 'Attempts to parse your code as ES6+, JSX, and Flow using the babel-jscs package as the parser.',
      type: 'boolean',
      default: false,
    },
    onlyConfig: {
      title: 'Only Config',
      description: 'Disable linter if there is no config file found for the linter.',
      type: 'boolean',
      default: false,
    },
    fixOnSave: {
      title: 'Fix on save',
      description: 'Fix JavaScript on save',
      type: 'boolean',
      default: false,
    },
    displayAs: {
      title: 'Display errors as',
      type: 'string',
      default: 'error',
      enum: ['error', 'warning', 'jscs Warning', 'jscs Error'],
    },
    configPath: {
      title: 'Config file path (Absolute or relative path to your project)',
      type: 'string',
      default: '',
    },
  };

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

  static get configPath() {
    return atom.config.get('linter-jscs.configPath');
  }

  static activate() {
    // Install dependencies using atom-package-deps
    require('atom-package-deps').install();

    this.observer = atom.workspace.observeTextEditors((editor) => {
      editor.getBuffer().onDidSave(() => {

        // Exclude `excludeFiles` for fix on save
        const config = this.getConfig(editor.getPath());
        var exclude = globule.isMatch(config && config.excludeFiles, this.getFilePath(editor.getPath()));

        if ((grammarScopes.indexOf(editor.getGrammar().scopeName) !== -1 && this.fixOnSave && !exclude) || this.testFixOnSave) {
          this.fixString(editor);
        }
      });
    });
  }

  static deactivate() {
    this.observer.dispose();
  }

  static provideLinter() {
    const helpers = require('atom-linter');
    return {
      name: 'JSCS',
      grammarScopes,
      scope: 'file',
      lintOnFly: true,
      lint: (editor, opts, overrideOptions, testFixOnSave) => {
        const JSCS = require('jscs');

        this.testFixOnSave = testFixOnSave;

        // We need re-initialize JSCS before every lint
        // or it will looses the errors, didn't trace the error
        // must be something with new 2.0.0 JSCS
        this.jscs = new JSCS();
        this.jscs.registerDefaultRules();

        const filePath = editor.getPath();
        const config = this.getConfig(filePath);

        // Options passed to `jscs` from package configuration
        const options = { esnext: this.esnext, preset: this.preset };

        this.jscs.configure(overrideOptions || config || options);

        // We don't have a config file present in project directory
        // let's return an empty array of errors
        if (!config && this.onlyConfig) return Promise.resolve([]);

        const text = editor.getText();
        const errors = this.jscs
          .checkString(text, filePath)
          .getErrorList();

        // Exclude `excludeFiles` for errors
        var exclude = globule.isMatch(config && config.excludeFiles, this.getFilePath(editor.getPath()));
        if (exclude) return Promise.resolve([]);

        return Promise.resolve(errors.map(({ rule, message, line, column }) => {
          const type = this.displayAs;
          const html = `<span class='badge badge-flexible'>${rule}</span> ${message}`;
          const range = helpers.rangeFromLineNumber(editor, line - 1, column - 1);

          return { type, html, filePath, range };
        }));
      },
    };
  }

  static getFilePath(path) {
    const relative = atom.project.relativizePath(path);
    return relative[1];
  }

  static getConfig(filePath) {
    if (path.isAbsolute(this.configPath)) {
      return configFile.load(false, this.configPath);
    }

    return configFile.load(false,
      path.join(path.dirname(filePath), this.configPath));
  }

  static fixString(editor) {
    const editorPath = editor.getPath();
    const editorText = editor.getText();

    const config = this.getConfig(editorPath);
    if (!config && this.onlyConfig) {
      return;
    }

    const fixedText = this.jscs.fixString(editorText, editorPath).output;
    if (editorText === fixedText) {
      return;
    }

    const cursorPosition = editor.getCursorScreenPosition();
    editor.setText(fixedText);
    editor.setCursorScreenPosition(cursorPosition);
  }
};

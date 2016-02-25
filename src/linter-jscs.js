'use babel';

import path from 'path';
import configFile from 'jscs/lib/cli-config';
import extractJs from 'jscs/lib/extract-js';
import globule from 'globule';
import objectAssign from 'object-assign';

const grammarScopes = ['source.js', 'source.js.jsx', 'text.html.basic'];

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
      editor.getBuffer().onWillSave(() => {

        if (grammarScopes.indexOf(editor.getGrammar().scopeName) !== -1 || this.testFixOnSave) {

          // Exclude `excludeFiles` for fix on save
          const config = this.getConfig(editor.getPath());
          var exclude = globule.isMatch(config && config.excludeFiles, this.getFilePath(editor.getPath()));

          if ((this.fixOnSave && !exclude) || this.testFixOnSave) {
            this.fixString(editor);
          }
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

        // `configPath` is non-enumerable so `Object.assign` won't copy it.
        // Without a proper `configPath` JSCS plugs cannot be loaded. See #175.
        let jscsConfig = overrideOptions || objectAssign({ esnext: this.esnext }, config || { preset: this.preset });
        if (!jscsConfig.configPath && config) {
          jscsConfig.configPath = config.configPath;
        }

        this.jscs.configure(jscsConfig);

        // We don't have a config file present in project directory
        // let's return an empty array of errors
        if (!config && this.onlyConfig) return Promise.resolve([]);

        const text = editor.getText();
        const scope = editor.getGrammar().scopeName;

        let errors;
        if (scope === 'text.html.basic' || scope === 'text.plain.null-grammar') { // text.plain.null-grammar is temp for tests
          let result = extractJs(filePath, text);

          result.sources.forEach((script) => {
            this.jscs.checkString(script.source, filePath).getErrorList().forEach((error) => {
              error.line += script.line;
              error.column += script.offset;
              result.addError(error);
            });
          }, this);

          errors = result.errors.getErrorList();
        } else {
          errors = this.jscs
            .checkString(text, filePath)
            .getErrorList();
        }

        // Exclude `excludeFiles` for errors
        var exclude = globule.isMatch(config && config.excludeFiles, this.getFilePath(editor.getPath()));
        if (exclude) return Promise.resolve([]);

        return Promise.resolve(errors.map(({ rule, message, line, column }) => {
          const type = this.displayAs;
          const html = `<span class='badge badge-flexible'>${rule}</span> ${message}`;

          /* Work around a bug in esprima causing jscs to report columns past
           * the end of the line. This is fixed in esprima@2.7.2, but as jscs
           * only depends on "~2.7.0" we need to wait on a jscs release depending
           * on a later version till this can be removed.
           * Ref: https://github.com/jquery/esprima/issues/1457
           * TODO: Remove when jscs updates
           */
          const maxCol = editor.getBuffer().lineLengthForRow(line - 1);
          if ((column - 1) > maxCol) {
            column = maxCol + 1;
          }

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

    const JSCS = require('jscs');

    // We need re-initialize JSCS before every lint
    // or it will looses the errors, didn't trace the error
    // must be something with new 2.0.0 JSCS
    this.jscs = new JSCS();
    this.jscs.registerDefaultRules();

    const filePath = editor.getPath();

    // Options passed to `jscs` from package configuration
    const options = { esnext: this.esnext };
    if (this.preset !== '<none>') {
      options.preset = this.preset;
    }

    // `configPath` is non-enumerable so `Object.assign` won't copy it.
    // Without a proper `configPath` JSCS plugs cannot be loaded. See #175.
    let jscsConfig = Object.assign({}, options, config);
    if (!jscsConfig.configPath && config) {
      jscsConfig.configPath = config.configPath;
    }

    this.jscs.configure(jscsConfig);

    const fixedText = this.jscs.fixString(editorText, editorPath).output;
    if (editorText === fixedText) {
      return;
    }

    const cursorPosition = editor.getCursorScreenPosition();
    editor.setText(fixedText);
    editor.setCursorScreenPosition(cursorPosition);
  }
};

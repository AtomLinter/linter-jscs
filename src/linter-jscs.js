'use babel';

import path from 'path';
import configFile from 'jscs/lib/cli-config';
import extractJs from 'jscs/lib/extract-js';
import globule from 'globule';
import objectAssign from 'object-assign';
import { CompositeDisposable } from 'atom';

const grammarScopes = ['source.js', 'source.js.jsx', 'text.html.basic'];

export default class LinterJSCS {
  static config = {
    preset: {
      title: 'Preset',
      description: 'Preset option is ignored if a config file is found for the linter.',
      type: 'string',
      default: 'airbnb',
      enum: [
        'airbnb', 'crockford', 'google', 'grunt', 'idiomatic', 'jquery', 'mdcs',
        'node-style-guide', 'wikimedia', 'wordpress', 'yandex',
      ],
    },
    esnext: {
      description: 'Attempts to parse your code as ES6+, JSX, and Flow using ' +
        'the babel-jscs package as the parser.',
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
      enum: ['error', 'warning'],
    },
    configPath: {
      title: 'Config file path (Absolute or relative path to your project)',
      type: 'string',
      default: '',
    },
  };

  static activate() {
    // Install dependencies using atom-package-deps
    require('atom-package-deps').install('linter-jscs');

    this.subscriptions = new CompositeDisposable;

    this.subscriptions.add(atom.config.observe('linter-jscs.preset', (preset) => {
      this.preset = preset;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.esnext', (esnext) => {
      this.esnext = esnext;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.onlyConfig', (onlyConfig) => {
      this.onlyConfig = onlyConfig;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.fixOnSave', (fixOnSave) => {
      this.fixOnSave = fixOnSave;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.displayAs', (displayAs) => {
      this.displayAs = displayAs;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.configPath', (configPath) => {
      this.configPath = configPath;
    }));

    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      editor.getBuffer().onWillSave(() => {
        if (grammarScopes.indexOf(editor.getGrammar().scopeName) !== -1 || this.testFixOnSave) {
          // Exclude `excludeFiles` for fix on save
          const config = this.getConfig(editor.getPath());
          const exclude = globule.isMatch(
            config && config.excludeFiles, this.getFilePath(editor.getPath())
          );

          if ((this.fixOnSave && !exclude) || this.testFixOnSave) {
            this.fixString(editor);
          }
        }
      });
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'linter-jscs:fix-file': () => {
        const textEditor = atom.workspace.getActiveTextEditor();

        if (!textEditor) {
          atom.notifications.addError('Linter-jscs: invalid textEditor received, aborting.');
          return;
        }

        this.fixString(textEditor);
      },
    }));
  }

  static deactivate() {
    this.subscriptions.dispose();
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

        const filePath = editor.getPath();

        // We need re-initialize JSCS before every lint
        // or it will looses the errors, didn't trace the error
        // must be something with new 2.0.0 JSCS
        this.jscs = new JSCS();
        this.jscs.registerDefaultRules();
        const config = this.getConfig(filePath);

        // We don't have a config file present in project directory
        // let's return an empty array of errors
        if (!config) return Promise.resolve([]);

        const jscsConfig = overrideOptions || config;
        this.jscs.configure(jscsConfig);

        const text = editor.getText();
        const scope = editor.getGrammar().scopeName;

        let errors;
        // text.plain.null-grammar is temp for tests
        if (scope === 'text.html.basic' || scope === 'text.plain.null-grammar') {
          const result = extractJs(filePath, text);

          result.sources.forEach((script) => {
            this.jscs.checkString(script.source, filePath).getErrorList().forEach((error) => {
              const err = error;
              err.line += script.line;
              err.column += script.offset;
              result.addError(err);
            });
          }, this);

          errors = result.errors.getErrorList();
        } else {
          errors = this.jscs
            .checkString(text, filePath)
            .getErrorList();
        }

        // Exclude `excludeFiles` for errors
        const exclude = globule.isMatch(
          config && config.excludeFiles, this.getFilePath(editor.getPath())
        );
        if (exclude) {
          return Promise.resolve([]);
        }

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
          let col = column;
          const maxCol = editor.getBuffer().lineLengthForRow(line - 1);
          if ((col - 1) > maxCol) {
            col = maxCol + 1;
          }

          const range = helpers.rangeFromLineNumber(editor, line - 1, col - 1);

          return { type, html, filePath, range };
        }));
      },
    };
  }

  static getFilePath(file) {
    const relative = atom.project.relativizePath(file);
    return relative[1];
  }

  static getConfig(filePath) {
    let config;
    if (path.isAbsolute(this.configPath)) {
      config = configFile.load(false, this.configPath);
    } else {
      config = configFile.load(false,
        path.join(path.dirname(filePath), this.configPath));
    }

    if (!config && this.onlyConfig) {
      return undefined;
    }

    // Options passed to `jscs` from package configuration
    const options = { esnext: this.esnext };
    const newConfig = objectAssign(
      options,
      config || { preset: this.preset }
    );
    // `configPath` is non-enumerable so `Object.assign` won't copy it.
    // Without a proper `configPath` JSCS plugs cannot be loaded. See #175.
    if (!newConfig.configPath && config && config.configPath) {
      newConfig.configPath = config.configPath;
    }
    return newConfig;
  }

  static fixString(editor) {
    const editorPath = editor.getPath();
    const editorText = editor.getText();

    const config = this.getConfig(editorPath);
    if (!config) {
      return;
    }

    const JSCS = require('jscs');

    // We need re-initialize JSCS before every lint
    // or it will looses the errors, didn't trace the error
    // must be something with new 2.0.0 JSCS
    this.jscs = new JSCS();
    this.jscs.registerDefaultRules();
    this.jscs.configure(config);

    const fixedText = this.jscs.fixString(editorText, editorPath).output;
    if (editorText === fixedText) {
      return;
    }

    const cursorPosition = editor.getCursorScreenPosition();
    editor.setText(fixedText);
    editor.setCursorScreenPosition(cursorPosition);
  }
}

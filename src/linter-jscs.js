'use babel';

import path from 'path';
import configFile from 'jscs/lib/cli-config';
import extractJs from 'jscs/lib/extract-js';
import globule from 'globule';
import objectAssign from 'object-assign';
import { CompositeDisposable } from 'atom';

const grammarScopes = ['source.js', 'source.js.jsx', 'text.html.basic'];

function startMeasure(baseName) {
  performance.mark(`${baseName}-start`);
}

function endMeasure(baseName) {
  if (atom.inDevMode()) {
    performance.mark(`${baseName}-end`);
    performance.measure(baseName, `${baseName}-start`, `${baseName}-end`);
    console.log(`${baseName} took: `, performance.getEntriesByName(baseName)[0].duration);
    performance.clearMarks(`${baseName}-end`);
    performance.clearMeasures(baseName);
  }
  performance.clearMarks(`${baseName}-start`);
}

let JSCS;

export default class LinterJSCS {
  static config = {
    preset: {
      title: 'Preset',
      description: 'Preset option is ignored if a config file is found for the linter.',
      type: 'string',
      default: 'airbnb',
      enum: [
        'airbnb', 'crockford', 'google', 'grunt', 'idiomatic', 'jquery', 'mdcs',
        'node-style-guide', 'wikimedia', 'wordpress',
      ],
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

    this.editorDisposables = new Map();
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      // Now we can handle multiple events for this editor
      const editorHandlers = new CompositeDisposable;
      this.editorDisposables.set(editor.id, editorHandlers);
      // Fix before saving
      editorHandlers.add(editor.getBuffer().onWillSave(() => {
        const scope = editor.getGrammar().scopeName;
        if (atom.workspace.getActiveTextEditor().id === editor.id &&
          (grammarScopes.indexOf(scope) !== -1 && scope !== 'text.html.basic')
          || this.testFixOnSave) {
          // Exclude `excludeFiles` for fix on save
          const config = this.getConfig(editor.getPath());
          const exclude = globule.isMatch(
            config && config.excludeFiles, this.getFilePath(editor.getPath())
          );

          if ((this.fixOnSave && !exclude) || this.testFixOnSave) {
            this.fixString(editor);
          }
        }
      }));
      // Remove all disposables associated with this editor
      editorHandlers.add(editor.onDidDestroy(() => {
        editorHandlers.dispose();
        this.editorDisposables.delete(editor.id);
      }));
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
    this.editorDisposables.forEach(editor => editor.dispose());
  }

  static provideLinter() {
    const helpers = require('atom-linter');
    return {
      name: 'JSCS',
      grammarScopes,
      scope: 'file',
      lintOnFly: true,
      lint: (editor, opts, overrideOptions, testFixOnSave) => {
        startMeasure('linter-jscs: Lint');

        // Load JSCS if it hasn't already been loaded
        if (!JSCS) {
          JSCS = require('jscs');
        }

        // Set only by specs
        this.testFixOnSave = testFixOnSave;

        const filePath = editor.getPath();
        const config = this.getConfig(filePath);

        // We don't have a config file present in project directory
        // let's return an empty array of errors
        if (!config) {
          endMeasure('linter-jscs: Lint');
          return Promise.resolve([]);
        }

        // Exclude `excludeFiles` for errors
        const exclude = globule.isMatch(
          config && config.excludeFiles, this.getFilePath(editor.getPath())
        );
        if (exclude) {
          endMeasure('linter-jscs: Lint');
          return Promise.resolve([]);
        }

        // We need re-initialize JSCS before every lint
        // or it will looses the errors, didn't trace the error
        // must be something with new 2.0.0 JSCS
        this.jscs = new JSCS();
        this.jscs.registerDefaultRules();

        const jscsConfig = overrideOptions || config;
        this.jscs.configure(jscsConfig);

        const text = editor.getText();
        const scope = editor.getGrammar().scopeName;

        let errors;
        // text.plain.null-grammar is temp for tests
        startMeasure('linter-jscs: JSCS');
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
        endMeasure('linter-jscs: JSCS');

        const translatedErrors = errors.map(({ rule, message, line, column }) => {
          const type = this.displayAs;
          // TODO: Remove this when https://github.com/jscs-dev/node-jscs/issues/2235 has been addressed
          const cleanMessage = message.replace(`${rule}: `, '');
          const html = `<span class='badge badge-flexible'>${rule}</span> ${cleanMessage}`;
          const range = helpers.rangeFromLineNumber(editor, line - 1, column - 1);

          return { type, html, filePath, range };
        });
        endMeasure('linter-jscs: Lint');
        return Promise.resolve(translatedErrors);
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
    const options = {};
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
    startMeasure('linter-jscs: Fix');
    const editorPath = editor.getPath();
    const config = this.getConfig(editorPath);
    if (!config) {
      return;
    }

    // Load JSCS if it hasn't already been loaded
    if (!JSCS) {
      JSCS = require('jscs');
    }

    // We need re-initialize JSCS before every lint
    // or it will looses the errors, didn't trace the error
    // must be something with new 2.0.0 JSCS
    this.jscs = new JSCS();
    this.jscs.registerDefaultRules();
    this.jscs.configure(config);

    const editorText = editor.getText();
    const fixedText = this.jscs.fixString(editorText, editorPath).output;
    if (editorText === fixedText) {
      return;
    }

    const cursorPosition = editor.getCursorScreenPosition();
    editor.setText(fixedText);
    editor.setCursorScreenPosition(cursorPosition);
    endMeasure('linter-jscs: Fix');
  }
}

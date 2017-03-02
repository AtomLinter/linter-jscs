'use babel';

import path from 'path';
import configFile from 'jscs/lib/cli-config';
import extractJs from 'jscs/lib/extract-js';
import globule from 'globule';
import objectAssign from 'object-assign';
// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';

// Internal variables
const grammarScopes = ['source.js', 'source.js.jsx', 'text.html.basic'];
let preset;
let onlyConfig;
let fixOnSave;
let displayAs;
let configPath;
let JSCS;
let jscs;

function startMeasure(baseName) {
  performance.mark(`${baseName}-start`);
}

function endMeasure(baseName) {
  if (atom.inDevMode()) {
    performance.mark(`${baseName}-end`);
    performance.measure(baseName, `${baseName}-start`, `${baseName}-end`);
    // eslint-disable-next-line no-console
    console.log(`${baseName} took: `, performance.getEntriesByName(baseName)[0].duration);
    performance.clearMarks(`${baseName}-end`);
    performance.clearMeasures(baseName);
  }
  performance.clearMarks(`${baseName}-start`);
}

function getFilePath(file) {
  const relative = atom.project.relativizePath(file);
  return relative[1];
}

function getConfig(filePath) {
  let config;
  if (path.isAbsolute(configPath)) {
    config = configFile.load(false, configPath);
  } else if (filePath) {
    config = configFile.load(false,
      path.join(path.dirname(filePath), configPath));
  }

  if (!config && onlyConfig) {
    return undefined;
  }

  // Options passed to `jscs` from package configuration
  const options = {};
  const newConfig = objectAssign(
    options,
    config || { preset },
  );
  // `configPath` is non-enumerable so `Object.assign` won't copy it.
  // Without a proper `configPath` JSCS plugs cannot be loaded. See #175.
  if (!newConfig.configPath && config && config.configPath) {
    newConfig.configPath = config.configPath;
  }
  return newConfig;
}

function fixString(editor) {
  startMeasure('linter-jscs: Fix');
  const editorPath = editor.getPath();
  const config = getConfig(editorPath);
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
  jscs = new JSCS();
  jscs.registerDefaultRules();
  jscs.configure(config);

  const editorText = editor.getText();
  const fixedText = jscs.fixString(editorText, editorPath).output;
  if (editorText === fixedText) {
    return;
  }

  const cursorPosition = editor.getCursorScreenPosition();
  editor.setText(fixedText);
  editor.setCursorScreenPosition(cursorPosition);
  endMeasure('linter-jscs: Fix');
}

export default {
  config: {
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
  },

  activate() {
    // Install dependencies using atom-package-deps
    require('atom-package-deps').install('linter-jscs');

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.config.observe('linter-jscs.preset', (value) => {
      preset = value;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.onlyConfig', (value) => {
      onlyConfig = value;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.fixOnSave', (value) => {
      fixOnSave = value;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.displayAs', (value) => {
      displayAs = value;
    }));

    this.subscriptions.add(atom.config.observe('linter-jscs.configPath', (value) => {
      configPath = value;
    }));

    this.editorDisposables = new Map();
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      if (!atom.workspace.isTextEditor(editor)) {
        // Make sure we are dealing with a real editor...
        return;
      }
      const filePath = editor.getPath();
      if (!filePath) {
        // Editor has never been saved, and thus has no path, just return for now.
        return;
      }
      // Now we can handle multiple events for this editor
      const editorHandlers = new CompositeDisposable();
      this.editorDisposables.set(editor.id, editorHandlers);
      // Fix before saving
      editorHandlers.add(editor.getBuffer().onWillSave(() => {
        const scope = editor.getGrammar().scopeName;
        if ((atom.workspace.getActiveTextEditor().id === editor.id &&
          (grammarScopes.indexOf(scope) !== -1 && scope !== 'text.html.basic'))
          || this.testFixOnSave) {
          // Exclude `excludeFiles` for fix on save
          const config = getConfig(filePath);
          const exclude = globule.isMatch(
            config && config.excludeFiles, getFilePath(filePath),
          );

          if ((fixOnSave && !exclude) || this.testFixOnSave) {
            fixString(editor);
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

        fixString(textEditor);
      },
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.editorDisposables.forEach(editor => editor.dispose());
  },

  provideLinter() {
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
        const config = getConfig(filePath);

        // We don't have a config file present in project directory
        // let's return an empty array of errors
        if (!config) {
          endMeasure('linter-jscs: Lint');
          return Promise.resolve([]);
        }

        // Exclude `excludeFiles` for errors
        const exclude = globule.isMatch(
          config && config.excludeFiles, getFilePath(editor.getPath()),
        );
        if (exclude) {
          endMeasure('linter-jscs: Lint');
          return Promise.resolve([]);
        }

        // We need re-initialize JSCS before every lint
        // or it will looses the errors, didn't trace the error
        // must be something with new 2.0.0 JSCS
        jscs = new JSCS();
        jscs.registerDefaultRules();

        const jscsConfig = overrideOptions || config;
        jscs.configure(jscsConfig);

        const text = editor.getText();
        const scope = editor.getGrammar().scopeName;

        let errors;
        // text.plain.null-grammar is temp for tests
        startMeasure('linter-jscs: JSCS');
        if (scope === 'text.html.basic' || scope === 'text.plain.null-grammar') {
          const result = extractJs(filePath, text);

          result.sources.forEach((script) => {
            jscs.checkString(script.source, filePath).getErrorList().forEach((error) => {
              const err = error;
              err.line += script.line;
              err.column += script.offset;
              result.addError(err);
            });
          }, this);

          errors = result.errors.getErrorList();
        } else {
          errors = jscs
            .checkString(text, filePath)
            .getErrorList();
        }
        endMeasure('linter-jscs: JSCS');

        const translatedErrors = errors.map(({ rule, message, line, column }) => {
          const type = displayAs;
          // TODO: Remove this when https://github.com/jscs-dev/node-jscs/issues/2235 has been addressed
          const cleanMessage = message.replace(`${rule}: `, '');
          const html = `<span class='badge badge-flexible'>${rule}</span> ${cleanMessage}`;
          const range = helpers.generateRange(editor, line - 1, column - 1);

          return { type, html, filePath, range };
        });
        endMeasure('linter-jscs: Lint');
        return Promise.resolve(translatedErrors);
      },
    };
  },
};

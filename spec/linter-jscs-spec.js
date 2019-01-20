'use babel';

import {
  // eslint-disable-next-line no-unused-vars
  it, fit, wait, beforeEach, afterEach,
} from 'jasmine-fix';
import temp from 'temp';
import * as path from 'path';
import linter from '../src/linter-jscs';

const sloppyPath = path.join(__dirname, 'files', 'sloppy.js');
const sloppyHTMLPath = path.join(__dirname, 'files', 'sloppy.html');
const goodPath = path.join(__dirname, 'files', 'good.js');
const emptyPath = path.join(__dirname, 'files', 'empty.js');
// const lflPath = path.join(__dirname, 'files', 'long-file-line.js');

describe('The jscs provider for Linter', () => {
  const { lint } = linter.provideLinter();

  beforeEach(async () => {
    const activationPromise = atom.packages.activatePackage('linter-jscs');

    await atom.packages.activatePackage('language-javascript');
    await atom.workspace.open(sloppyPath);

    atom.packages.triggerDeferredActivationHooks();
    await activationPromise;
  });

  it('should be in the packages list',
    () => expect(atom.packages.isPackageLoaded('linter-jscs')).toBe(true));

  it('should be an active package',
    () => expect(atom.packages.isPackageActive('linter-jscs')).toBe(true));

  it('checks sloppy.js and verifies the first message', async () => {
    const editor = await atom.workspace.open(sloppyPath);
    const messages = await lint(editor);
    const message = 'requireTrailingComma: '
      + 'Missing comma before closing curly brace';

    expect(messages.length).toBe(2);
    expect(messages[0].severity).toBe('error');
    expect(messages[0].description).not.toBeDefined();
    expect(messages[0].excerpt).toBe(message);
    expect(messages[0].location.file).toBe(sloppyPath);
    expect(messages[0].location.position).toEqual([[2, 9], [2, 11]]);
  });

  it('finds nothing wrong with an empty file', async () => {
    const editor = await atom.workspace.open(emptyPath);
    const messages = await lint(editor);

    expect(messages.length).toBe(0);
  });

  it('finds nothing wrong with a valid file', async () => {
    const editor = await atom.workspace.open(goodPath);
    const messages = await lint(editor);

    expect(messages.length).toBe(0);
  });

  it('checks sloppy.html and verifies the first message', async () => {
    const editor = await atom.workspace.open(sloppyHTMLPath);
    const messages = await lint(editor);
    const message = 'requireTrailingComma: '
      + 'Missing comma before closing curly brace';

    expect(messages.length).toBe(2);
    expect(messages[0].severity).toBe('error');
    expect(messages[0].description).not.toBeDefined();
    expect(messages[0].excerpt).toBe(message);
    expect(messages[0].location.file).toBe(sloppyHTMLPath);
    expect(messages[0].location.position).toEqual([[11, 15], [11, 17]]);
  });

  describe('provides override options and', () => {
    let editor = null;
    beforeEach(async () => {
      editor = await atom.workspace.open(sloppyPath);
    });

    it('should return no errors if the file is excluded', async () => {
      const messages = await lint(editor, {}, { excludeFiles: ['sloppy.js'] });
      expect(messages.length).toBe(0);
    });

    it('should return no errors if `requireTrailingComma` is set to null', async () => {
      const messages = await lint(editor, {}, { requireTrailingComma: null });
      expect(messages.length).toBe(0);
    });
  });

  it('should fix the file on save', async () => {
    const editor = await atom.workspace.open(sloppyPath);
    const tempFile = temp.track().openSync().path;
    await editor.saveAs(tempFile);
    const messages = await lint(editor, {}, { }, true);

    expect(messages.length).toBe(0);
  });

  describe('commands', () => {
    describe('fix command', () => {
      it('fixes sloppy.js', async () => {
        const editor = await atom.workspace.open(sloppyPath);
        const editorView = atom.views.getView(editor);
        atom.commands.dispatch(editorView, 'linter-jscs:fix-file');
        const messages = await lint(editor);

        expect(messages.length).toBe(0);
      });
    });
  });

/*
  // FIXME: The custom rule needs to be updated for `jscs` v3!
  describe('custom rules', () => {
    let editor = null;
    beforeEach(async () => {
      editor = await atom.workspace.open(lflPath);
    });

    it('should throw error for empty function call', async () => {
      const config = {
        additionalRules: [
          path.join('.', 'spec', 'rules', '*.js'),
        ],
        lineLength: 40,
      };
      const message = '<span class=\'badge badge-flexible\'>lineLength</span> ' +
        'Line must be at most 40 characters';
      const messages = await lint(editor, {}, config);

      expect(messages.length).toBe(1);
      expect(messages[0].html).toBe(message);
    });
  });
*/
});

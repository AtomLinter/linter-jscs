'use babel';

// var lint = require('../src/linter-jscs');

import linter from '../src/linter-jscs';
import temp from 'temp';
import * as path from 'path';
const sloppyPath = path.join(__dirname, 'files', 'sloppy.js');
const sloppyHTMLPath = path.join(__dirname, 'files', 'sloppy.html');
const goodPath = path.join(__dirname, 'files', 'good.js');
const emptyPath = path.join(__dirname, 'files', 'empty.js');
const lflPath = path.join(__dirname, 'files', 'long-file-line.js');

describe('The jscs provider for Linter', () => {
  const lint = linter.provideLinter().lint;

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage('linter-jscs');
    });
    waitsForPromise(() => {
      return atom.packages.activatePackage('language-javascript');
    });
    waitsForPromise(() => {
      return atom.workspace.open(sloppyPath);
    });
  });

  it('should be in the packages list', () => {
    return expect(atom.packages.isPackageLoaded('linter-jscs')).toBe(true);
  });

  it('should be an active package', () => {
    return expect(atom.packages.isPackageActive('linter-jscs')).toBe(true);
  });

  describe('checks sloppy.js and', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() => {
        return atom.workspace.open(sloppyPath).then(openEditor => {
          editor = openEditor;
        });
      });
    });

    it('finds at least one message', () => {
      waitsForPromise(() => {
        return lint(editor).then(messages => {
          expect(messages.length).toBeGreaterThan(0);
        });
      });
    });

    it('verifies the first message', () => {
      waitsForPromise(() => {
        return lint(editor).then(messages => {
          expect(messages[0].type).toBeDefined();
          expect(messages[0].type).toEqual('error');
          expect(messages[0].html).toBeDefined();
          expect(messages[0].html).toEqual('<span class=\'badge badge-flexible\'>requireTrailingComma</span> Missing comma before closing curly brace');
          expect(messages[0].filePath).toBeDefined();
          expect(messages[0].filePath).toMatch(/.+sloppy\.js$/);
          expect(messages[0].range).toBeDefined();
          expect(messages[0].range.length).toEqual(2);
          expect(messages[0].range).toEqual([[2, 11], [2, 12]]);
        });
      });
    });
  });

  it('finds nothing wrong with an empty file', () => {
    waitsForPromise(() => {
      return atom.workspace.open(emptyPath).then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(0);
        });
      });
    });
  });

  it('finds nothing wrong with a valid file', () => {
    waitsForPromise(() => {
      return atom.workspace.open(goodPath).then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(0);
        });
      });
    });
  });

  describe('checks sloppy.html and', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() => {
        return atom.workspace.open(sloppyHTMLPath).then(openEditor => {
          editor = openEditor;
        });
      });
    });

    it('finds at least one message', () => {
      waitsForPromise(() => {
        return lint(editor).then(messages => {
          expect(messages.length).toBeGreaterThan(0);
        });
      });
    });

    it('verifies the first message', () => {
      waitsForPromise(() => {
        return lint(editor).then(messages => {
          expect(messages[0].type).toBeDefined();
          expect(messages[0].type).toEqual('error');
          expect(messages[0].html).toBeDefined();
          expect(messages[0].html).toEqual('<span class=\'badge badge-flexible\'>requireTrailingComma</span> Missing comma before closing curly brace');
          expect(messages[0].filePath).toBeDefined();
          expect(messages[0].filePath).toMatch(/.+sloppy\.html$/);
          expect(messages[0].range).toBeDefined();
          expect(messages[0].range.length).toEqual(2);
          expect(messages[0].range).toEqual([[11, 17], [11, 18]]);
        });
      });
    });
  });

  describe('provides override options and', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() => {
        return atom.workspace.open(sloppyPath).then(openEditor => {
          editor = openEditor;
        });
      });
    });

    it('should return no errors if the file is excluded', () => {
      waitsForPromise(() => {
        return lint(editor, {}, { excludeFiles: ['sloppy.js'] }).then(messages => {
          expect(messages.length).toEqual(0);
        });
      });
    });

    it('should return no errors if `requireTrailingComma` is set to null', () => {
      waitsForPromise(() => {
        return lint(editor, {}, { requireTrailingComma: null }).then(messages => {
          expect(messages.length).toEqual(0);
        });
      });
    });
  });

  describe('save', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() => {
        return atom.workspace.open(sloppyPath).then(openEditor => {
          editor = openEditor;
        });
      });
    });

    it('should fix the file', () => {
      waitsForPromise(() => {
        const tempFile = temp.openSync().path;
        editor.saveAs(tempFile);

        return lint(editor, {}, { }, true).then(messages => {
          expect(messages.length).toEqual(0);
        });
      });
    });
  });

  describe('custom rules', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() => {
        return atom.workspace.open(lflPath).then(openEditor => {
          editor = openEditor;
        });
      });
    });

    it('should throw error for empty function call', () => {
      waitsForPromise(() => {

        const config = {
          additionalRules: [
            path.join('.', 'spec', 'rules', '*.js'),
          ],
          lineLength: 40,
        };

        return lint(editor, {}, config).then(messages => {
          expect(messages.length).toEqual(1);
          expect(messages[0].html).toEqual('<span class=\'badge badge-flexible\'>lineLength</span> Line must be at most 40 characters');
        });
      });
    });
  });
});

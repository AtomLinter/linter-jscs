'use babel';

import linter from '../src/linter-jscs';
import temp from 'temp';
import * as path from 'path';

const sloppyPath = path.join(__dirname, 'files', 'sloppy.js');
const sloppyHTMLPath = path.join(__dirname, 'files', 'sloppy.html');
const goodPath = path.join(__dirname, 'files', 'good.js');
const emptyPath = path.join(__dirname, 'files', 'empty.js');
// const lflPath = path.join(__dirname, 'files', 'long-file-line.js');

describe('The jscs provider for Linter', () => {
  const lint = linter.provideLinter().lint;

  beforeEach(() => {
    waitsForPromise(() =>
      atom.packages.activatePackage('linter-jscs')
    );
    waitsForPromise(() =>
      atom.packages.activatePackage('language-javascript')
    );
    waitsForPromise(() =>
      atom.workspace.open(sloppyPath)
    );
  });

  it('should be in the packages list', () =>
    expect(atom.packages.isPackageLoaded('linter-jscs')).toBe(true)
  );

  it('should be an active package', () =>
    expect(atom.packages.isPackageActive('linter-jscs')).toBe(true)
  );

  describe('checks sloppy.js and', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(sloppyPath).then(openEditor => {
          editor = openEditor;
        })
      );
    });

    it('finds at least one message', () => {
      waitsForPromise(() =>
        lint(editor).then(messages => {
          expect(messages.length).toBeGreaterThan(0);
        })
      );
    });

    it('verifies the first message', () => {
      const message = '<span class=\'badge badge-flexible\'>requireTrailingComma</span>' +
        ' Missing comma before closing curly brace';
      waitsForPromise(() =>
        lint(editor).then(messages => {
          expect(messages[0].type).toBe('error');
          expect(messages[0].text).not.toBeDefined();
          expect(messages[0].html).toBe(message);
          expect(messages[0].filePath).toBe(sloppyPath);
          expect(messages[0].range).toEqual([[2, 9], [2, 11]]);
        })
      );
    });
  });

  it('finds nothing wrong with an empty file', () => {
    waitsForPromise(() =>
      atom.workspace.open(emptyPath).then(editor =>
        lint(editor).then(messages => {
          expect(messages.length).toBe(0);
        })
      )
    );
  });

  it('finds nothing wrong with a valid file', () => {
    waitsForPromise(() =>
      atom.workspace.open(goodPath).then(editor =>
        lint(editor).then(messages => {
          expect(messages.length).toBe(0);
        })
      )
    );
  });

  describe('checks sloppy.html and', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(sloppyHTMLPath).then(openEditor => {
          editor = openEditor;
        })
      );
    });

    it('finds at least one message', () => {
      waitsForPromise(() =>
        lint(editor).then(messages => {
          expect(messages.length).toBeGreaterThan(0);
        })
      );
    });

    it('verifies the first message', () => {
      const message = '<span class=\'badge badge-flexible\'>requireTrailingComma</span> ' +
        'Missing comma before closing curly brace';
      waitsForPromise(() =>
        lint(editor).then(messages => {
          expect(messages[0].type).toBe('error');
          expect(messages[0].text).not.toBeDefined();
          expect(messages[0].html).toBe(message);
          expect(messages[0].filePath).toBe(sloppyHTMLPath);
          expect(messages[0].range).toEqual([[11, 15], [11, 17]]);
        })
      );
    });
  });

  describe('provides override options and', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(sloppyPath).then(openEditor => {
          editor = openEditor;
        })
      );
    });

    it('should return no errors if the file is excluded', () => {
      waitsForPromise(() =>
        lint(editor, {}, { excludeFiles: ['sloppy.js'] }).then(messages => {
          expect(messages.length).toBe(0);
        })
      );
    });

    it('should return no errors if `requireTrailingComma` is set to null', () => {
      waitsForPromise(() =>
        lint(editor, {}, { requireTrailingComma: null }).then(messages => {
          expect(messages.length).toBe(0);
        })
      );
    });
  });

  describe('save', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(sloppyPath).then(openEditor => {
          editor = openEditor;
        })
      );
    });

    it('should fix the file', () => {
      waitsForPromise(() => {
        const tempFile = temp.openSync().path;
        editor.saveAs(tempFile);

        return lint(editor, {}, { }, true).then(messages => {
          expect(messages.length).toBe(0);
        });
      });
    });
  });

  describe('commands', () => {
    describe('fix command', () => {
      it('fixes sloppy.js', () => {
        let editor;

        waitsForPromise(() =>
          atom.workspace.open(sloppyPath).then(openEditor => {
            editor = openEditor;
          })
        );

        waitsForPromise(() => {
          const editorView = atom.views.getView(editor);
          atom.commands.dispatch(editorView, 'linter-jscs:fix-file');
          return lint(editor).then(messages => {
            expect(messages.length).toBe(0);
          });
        });
      });
    });
  });

/*
// FIXME: The custom rule needs to be updated for `jscs` v3!
  describe('custom rules', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(lflPath).then(openEditor => {
          editor = openEditor;
        })
      );
    });

    it('should throw error for empty function call', () => {
      const config = {
        additionalRules: [
          path.join('.', 'spec', 'rules', '*.js'),
        ],
        lineLength: 40,
      };
      const message = '<span class=\'badge badge-flexible\'>lineLength</span> ' +
        'Line must be at most 40 characters';
      waitsForPromise(() =>
        lint(editor, {}, config).then(messages => {
          expect(messages.length).toBe(1);
          expect(messages[0].html).toBe(message);
        })
      );
    });
  });
*/
});

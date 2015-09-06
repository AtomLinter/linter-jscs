JSCS Linter
===========

> JSCS — JavaScript Code Style is a code style checker. You can configure jscs for your project in detail using over 60 validation rules. See [mdevils/node-jscs](https://github.com/mdevils/node-jscs) for more informations about JSCS.

This package will lint your `.js` and `.jsx` opened filed in Atom through [jscs linter](https://github.com/mdevils/node-jscs). **It will lint on edit and/or on save**, so you'll see instantly if your code is sticking your code conventions/style.

* Support `.jscs.json`, `.jscsrc` and `package.json` configurations files
* Switch between `jscs` preset with ease.
* Enable `esnext` for babel ES6/ES7/JSX syntax support.
* Can autofix your file to the codestyle.

(Install [React package](https://atom.io/packages/react) to have `.jsx` files syntax recognized, and possibly linted by the linter)

A gif is better than everything:

![linter-jscs](https://github.com/iam4x/linter-jscs/raw/master/example.gif)

(you can see `linter-jscs` and `linter-jshint` working together without any problems).

## Installation

* `$ apm install linter-jscs`

## Other available linters
- [linter-phpcs](https://atom.io/packages/linter-phpcs) - Linter plugin for PHP, using phpcs.
- [linter-phpmd](https://atom.io/packages/linter-phpmd) - Linter plugin for PHP, using phpmd.
- [linter-jshint](https://atom.io/packages/linter-jshint) - Linter plugin for JavaScript, using jshint.
- [linter-scss-lint](https://atom.io/packages/linter-scss-lint) - Sass Linter plugin for SCSS, using scss-lint.
- [linter-coffeelint](https://atom.io/packages/linter-coffeelint) Linter plugin for CoffeeScript, using coffeelint.
- [linter-csslint](https://atom.io/packages/linter-csslint) Linter plugin for CSS, using csslint.
- [linter-rubocop](https://atom.io/packages/linter-rubocop) - Linter plugin for Ruby, using rubocop.
- [linter-tslint](https://atom.io/packages/linter-tslint) Linter plugin for TypeScript, using tslint.

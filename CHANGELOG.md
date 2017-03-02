# Change Log

## v4.1.2

*   Update `atom-linter` to v9.0.0 ([#323](https://github.com/AtomLinter/linter-jscs/pull/323))
*   Handle editors with no path in Fix-on-Save ([#328](https://github.com/AtomLinter/linter-jscs/pull/328))

## v4.1.1

*   Remove unused styles that were triggering deprecation warnings ([#318](https://github.com/AtomLinter/linter-jscs/pull/318))

## v4.1.0

*   Update JSCS to v3.0.7 ([#283](https://github.com/AtomLinter/linter-jscs/pull/283))
    *   This is the _**LAST**_ release ever for JSCS
*   Only activate `linter-jscs` when it could be used ([#295](https://github.com/AtomLinter/linter-jscs/pull/295))

## v4.0.5

*   Update `atom-linter` to v6.0.0 ([#273](https://github.com/AtomLinter/linter-jscs/pull/273))
*   Update JSCS to v3.0.6 ([#278](https://github.com/AtomLinter/linter-jscs/pull/278))

## v4.0.4

*   Update JSCS to v3.0.5 ([#272](https://github.com/AtomLinter/linter-jscs/pull/272))

## v4.0.3

*   Update JSCS to v3.0.4 ([#262](https://github.com/AtomLinter/linter-jscs/pull/262))

## v4.0.2

*   Remove the non-existant Yandex preset ([#253](https://github.com/AtomLinter/linter-jscs/pull/253))
*   No longer attempt to run fix-on-save on a destroyed editor ([#247](https://github.com/AtomLinter/linter-jscs/pull/247))

## v4.0.1

*   Don't run Fix-on-Save on HTML files, that method doesn't support them ([#250](https://github.com/AtomLinter/linter-jscs/pull/250))

## v4.0.0

*   Update to JSCS v3.0.3

## v3.5.0

*   Add a command to trigger fixing ([#212](https://github.com/AtomLinter/linter-jscs/pull/212))
*   Update JSCS to v2.11.0

## v3.4.10

*   Fix [#196](https://github.com/AtomLinter/linter-jscs/issues/196) (again) ([#204](https://github.com/AtomLinter/linter-jscs/pull/204))

## v3.4.9

*   Fix ([#197](https://github.com/AtomLinter/linter-jscs/issues/197)) by
    unifying config discovery.

## v3.4.8

*   Fix ([#196](https://github.com/AtomLinter/linter-jscs/issues/196)) where
    linting was happening without config file

## v3.4.7

*   Revert old behavior of skipping local preset if there is a config file.
*   Change `onDidSave` to `onWillSave`

## v3.4.6

*   Support Linting of Inline JS ([#110](https://github.com/AtomLinter/linter-jscs/issues/110))

## v3.4.5

*   Add `<none>` "preset" option ([#178](https://github.com/AtomLinter/linter-jscs/pull/178))
*   Fix merging of `configPath` property ([#176](https://github.com/AtomLinter/linter-jscs/pull/176))

## v3.4.4

*   Fix Bug With JSON Files Being Parsed ([#174](https://github.com/AtomLinter/linter-jscs/issues/174))

## v3.4.2

*   Upgrade JSPM to 2.9.0
*   Merge Package Options with .jscsrc file

## v3.4.1

*   Use `rangeFromLineNumber` to highlight errors

## v3.4.0

*   Fix Incorrect Column Number on Errors ([#122](https://github.com/AtomLinter/linter-jscs/issues/122))

## v3.3.1

*   Add Tests

## v3.3.0

*   Skip Excluded Files ([#154](https://github.com/AtomLinter/linter-jscs/pull/154))

## v3.2.2

*   Fix a race condition ([#151](https://github.com/AtomLinter/linter-jscs/pull/151))

## v3.2.1

*   Update dependencies

## v3.2.0

*   Add config file path option ([#129](https://github.com/AtomLinter/linter-jscs/pull/129))

## v3.1.2

*   maintain cursor position after fix ([#125](https://github.com/AtomLinter/linter-jscs/pull/125))

## v3.1.1

*   Add idiomatic preset ([#119](https://github.com/AtomLinter/linter-jscs/pull/119))

## v3.1.0

*   Add two new error types
*   Add name for linter

## v2.0.1 - 28/07/2015

**Bug fixes**

*   Error with `esnext` option
*   Bug with `package.json` and `.jscsrc` config not correctly loaded

## v2.0.0 - 28/07/2015

**Features**

*   Rewrite to ES6 ([#71](https://github.com/AtomLinter/linter-jscs/pull/71))
*   Support `atom-linter` 1.0 API ([#71](https://github.com/AtomLinter/linter-jscs/pull/71))
*   Support `jscs` 2.0.0
*   Support `esnext` option (babel)

## v1.13.0 - 21/07/2015

**Features**

*   Add `node-style` preset ([#68](https://github.com/AtomLinter/linter-jscs/pull/68))

**Bug fixes**

*   Support `excludeFiles` rules ([#57](https://github.com/AtomLinter/linter-jscs/pull/57))

## v1.11.0 - 05/04/2015

**Features**

*   Can select type of lint message ([#50](https://github.com/AtomLinter/linter-jscs/pull/50))

**Bug Fixes**

*   Fix deprecation warning ([#48](https://github.com/AtomLinter/linter-jscs/pull/48))
*   Fix harmony setting description ([#46](https://github.com/AtomLinter/linter-jscs/pull/46))

## v1.7.0 - 02/25/2015

**Features**

*   Add option to disable linter when no config file is found ([#18](https://github.com/AtomLinter/linter-jscs/issues/18))
*   Add grunt preset to configuration ([#32](https://github.com/AtomLinter/linter-jscs/pull/32))

**Bug Fixes**

*   Fix config path splitting in order to be OS agnostic ([#35](https://github.com/AtomLinter/linter-jscs/pull/35))

## v1.6.0 - 02/17/2015

**Improvements**

*   Changed the way linter messages are parsed. ([#21](https://github.com/AtomLinter/linter-jscs/pull/21))

*   Added JSX support with `esprima-fb`, enable `harmony` option and install [Atom React](http://orktes.github.io/atom-react/) package.

*   Added `verbose` option, prepends the name of the offending rule to all
    error messages.

*   Added support of `package.json` config file ([#28](https://github.com/AtomLinter/linter-jscs/issues/28)).

## v1.5.0 - 02/17/2015

**Features**

*   Added a new `harmony` option, to enable ES6 linting

## v1.4.9 - 08/09/2014

**Bug Fixes**

*   Fixed .jscsrc file breaking linter-jscs ([#15](https://github.com/AtomLinter/linter-jscs/issues/15))

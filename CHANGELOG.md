# v1.11.0 - 05/04/2015
### Features
* Can select type of lint message ([#50](https://github.com/AtomLinter/linter-jscs/pull/50))

### Bug Fixes
* Fix deprecation warning ([#48](https://github.com/AtomLinter/linter-jscs/pull/48))
* Fix harmony setting description ([#46](https://github.com/AtomLinter/linter-jscs/pull/46))

# v1.7.0 - 02/25/2015
### Features
* Add option to disable linter when no config file is found ([#18](https://github.com/AtomLinter/linter-jscs/issues/18))
* Add grunt preset to configuration ([#32](https://github.com/AtomLinter/linter-jscs/pull/32))

### Bug Fixes
* Fix config path splitting in order to be OS agnostic ([#35](https://github.com/AtomLinter/linter-jscs/pull/35))

# v1.6.0 - 02/17/2015
### Improvements
* Changed the way linter messages are parsed. ([#21](https://github.com/AtomLinter/linter-jscs/pull/21))
* Added JSX support with `esprima-fb`, enable `harmony` option and install [Atom React](http://orktes.github.io/atom-react/) package.
* Added `verbose` option, prepends the name of the offending rule to all error messages.
* Added support of `package.json` config file ([#28](https://github.com/AtomLinter/linter-jscs/issues/28)).

# v1.5.0 - 02/17/2015
### Features
* Added a new `harmony` option, to enable ES6 linting

# v1.4.9 - 08/09/2014
### Bug Fixes
* Fixed .jscsrc file breaking linter-jscs ([#15](https://github.com/AtomLinter/linter-jscs/issues/15))

### 2015-10-20 v0.6.0

* Cmpatibility with Bower dependencies without any .js or .css main file (#55, by [@frontday](https://github.com/frontday)).
* [process](https://github.com/sapegin/grunt-bower-concat#process) options (by [@Keyes](https://github.com/Keyes)).

### 2015-05-20 v0.5.0

* [separator](Readme.md#separator) option (by [@epferrari](https://github.com/epferrari)).
* [includeDev](Readme.md#includedev) option (by [@VincentBiragnet](https://github.com/VincentBiragnet)).
* Ability to override main file if it was specified in package’s bower.json (by [@cetra3](https://github.com/cetra3)).
* Pretty output of files which will be concatenated in verbose mode (by [@vstukanov](https://github.com/vstukanov)).

### 2014-10-08 v0.4.0

* CSS support (by [@kevinschaul](https://github.com/kevinschaul)).
* Fix undefined `canonicalDir` for packages without `bower.json` (#29).

### 2014-07-10 v0.3.0

* Use Bower in offline mode (fix #20). Do not require internet and faster.

### 2014-07-09 v0.2.5

* Bug fixes.

### 2014-01-22 v0.2.4

* `callback` option.
* Fix path duplication when `relative` is `false` in `bowerOptions` (#15).

### 2013-12-29 v0.2.3

* Respect `cwd` option of `.bowerrc` (by [@philippbosch](https://github.com/philippbosch)).

### 2013-12-17 v0.2.2

* Fix bad path passed as a main file in the bower.json (by [@kaseyq](https://github.com/kaseyq)).

### 2013-12-03 v0.2.1

* `mainFiles` option.
* Do not treat components with `.js` in name as files (#11).
* Supports multiple JS files in `bower.json`’s `main` section (by [@seanhess](https://github.com/seanhess)).
* Other bug fixes.

### 2013-11-22 v0.2.0

* Respect component dependencies when ordering the files for concatination (by [@swissmanu](https://github.com/swissmanu)).
* `bowerOptions` option (by [@madzak](https://github.com/madzak)).

### 2013-11-08 v0.1.2

* Rename task to prevent conflicts with other Bower related tasks.

### 2013-08-20 v0.1.1

* Bug fixes.

### 2013-04-05 v0.1.0

* Initial release.

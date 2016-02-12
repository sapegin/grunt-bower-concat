# 1.0.0 - 2016-02-12

## Breaking changes

### concatination of any file types

The new API looks like this:

```js
bower_concat: {
	main: {
		dest: {
		    js: 'build/_bower.js',
		    scss: 'build/_bower.scss,
		    coffee: 'build/_bower.coffee
		},
		// ...
	}
}
```

The old `dest` as a string (`{dest: 'build/_bower.js'}`) is still working but the `cssDest` was removed.

Thanks @alwin-rewedigital, #65.

## Other changes

* Update peerDependencies to be able to work with Grunt 1.0.

# 0.6.0 - 2015-10-20

* Cmpatibility with Bower dependencies without any .js or .css main file (#55, by [@frontday](https://github.com/frontday)).
* [process](https://github.com/sapegin/grunt-bower-concat#process) options (by [@Keyes](https://github.com/Keyes)).

# 0.5.0 - 2015-05-20

* [separator](Readme.md#separator) option (by [@epferrari](https://github.com/epferrari)).
* [includeDev](Readme.md#includedev) option (by [@VincentBiragnet](https://github.com/VincentBiragnet)).
* Ability to override main file if it was specified in package’s bower.json (by [@cetra3](https://github.com/cetra3)).
* Pretty output of files which will be concatenated in verbose mode (by [@vstukanov](https://github.com/vstukanov)).

# 0.4.0 - 2014-10-08

* CSS support (by [@kevinschaul](https://github.com/kevinschaul)).
* Fix undefined `canonicalDir` for packages without `bower.json` (#29).

# 0.3.0 - 2014-07-10

* Use Bower in offline mode (fix #20). Do not require internet and faster.

# 0.2.5 - 2014-07-09

* Bug fixes.

# 0.2.4 - 2014-01-22

* `callback` option.
* Fix path duplication when `relative` is `false` in `bowerOptions` (#15).

# 0.2.3 - 2013-12-29

* Respect `cwd` option of `.bowerrc` (by [@philippbosch](https://github.com/philippbosch)).

# 0.2.2 - 2013-12-17

* Fix bad path passed as a main file in the bower.json (by [@kaseyq](https://github.com/kaseyq)).

# 0.2.1 - 2013-12-03

* `mainFiles` option.
* Do not treat components with `.js` in name as files (#11).
* Supports multiple JS files in `bower.json`’s `main` section (by [@seanhess](https://github.com/seanhess)).
* Other bug fixes.

# 0.2.0 - 2013-11-22

* Respect component dependencies when ordering the files for concatination (by [@swissmanu](https://github.com/swissmanu)).
* `bowerOptions` option (by [@madzak](https://github.com/madzak)).

# 0.1.2 - 2013-11-08

* Rename task to prevent conflicts with other Bower related tasks.

# 0.1.1 - 2013-08-20

* Bug fixes.

# 0.1.0 - 2013-04-05

* Initial release.

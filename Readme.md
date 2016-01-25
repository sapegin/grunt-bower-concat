# Bower components builder for Grunt

[![Powered by You](http://sapegin.github.io/powered-by-you/badge.svg)](http://sapegin.github.io/powered-by-you/)
[![Build Status](https://travis-ci.org/sapegin/grunt-bower-concat.png)](https://travis-ci.org/sapegin/grunt-bower-concat)

Automatic concatenation of installed [Bower](https://github.com/bower/bower) components (JS and/or CSS) in the right order.


## Installation

This plugin requires Grunt 0.4.

```
$ npm install grunt-bower-concat --save-dev
```


## Configuration

Add somewhere in your `Gruntfile.js`:

```javascript
grunt.loadNpmTasks('grunt-bower-concat');
```

Inside your `Gruntfile.js` file add a section named `bower_concat`. See Parameters section below for details.


### Options

#### separator

Type: `String` Default: `grunt.util.linefeed`

Concatenated files will be joined on this string. If you're post-processing concatenated JavaScript files with a minifier, you may need to use a semicolon ';\n' as the separator. Separator is only applied to concatenated JS files.

`options: { separator : ';' }`

### Parameters

#### dest

Type: `Object`, required. Defines the filetypes to be concatenated into a destination file.
Where the key is the file extension (without the dot) and the value is the destination file.
E.g:

```
dest: {
    js: 'build/_bower.js',
    scss: 'build/_bower.scss,
    coffee: 'build/_bower.coffee
}
```

Also this version still supports this field to be a String, but this is deprecated:
(Deprecated) Type: `String`, defines into which file all .js files should be concatenated.


Name of JS file where result of concatenation will be saved.

#### exclude

Type: `String|Array`, optional.

List of components you want to exclude.

```js
exclude: [
  'jquery',
  'modernizr'
]
```

#### include

Type: `String|Array`, optional.

By default bower-concat will include all installed in project components. Using `include` option you can manually specify which components should be included.

```js
include: [
  'underscore',
  'backbone'
]
```

#### dependencies

Type: `Object`, optional.

Unfortunately not all Bower components list their dependencies. If components concatenate in the wrong order, use this option to manually specify dependencies for those components.

```js
dependencies: {
  'underscore': 'jquery',
  'mygallery': ['jquery', 'fotorama']
}
```

#### mainFiles

Type: `Object`, optional.

Some Bower components don’t list their main files or (more likely) don’t have `bower.json` file at all. In this case `bower-concat` will try to guess main file but sometimes it can’t or choose wrong one. You could explicitly define main files for that components.

```js
mainFiles: {
  'svg.js': 'dist/svg.js',
  'mygallery': ['src/base.js', 'src/gallery.js', 'src/style.css']
}
```

#### callback

Type: `Function`, optional.

This function will be called for every Bower component and allows you to change main files chosen by `bower-concat`.

```js
callback: function(mainFiles, component) {
  return _.map(mainFiles, function(filepath) {
    // Use minified files if available
    var min = filepath.replace(/\.js$/, '.min.js');
    return grunt.file.exists(min) ? min : filepath;
  });
}
```

#### process

Type: `Function`, optional.

This function will be called for every Bower component and allows you to change the contents of every file.

```js
process: function(src) {
	// wrap each library in a self executing function with "use strict"
  return "\n" +
    ";(function( window, jQuery, angular, undefined ){ \n 'use strict';\n\n" +
    src +
    "\n\n}( window, jQuery, angular ));";
}
```

#### bowerOptions

Type: `Object`, optional.

Bower specific options that will be passed in during the `bower.commands` calls.

```js
bowerOptions: {
  relative: false
}
```
#### includeDev

Type: `Boolean`, default: `false`.

Include `devDependencies` along with regular `dependencies`.


### Config Example

``` javascript
bower_concat: {
  all: {
    dest: 'build/_bower.js',
    cssDest: 'build/_bower.css',
    exclude: [
      'jquery',
      'modernizr'
    ],
    dependencies: {
      'underscore': 'jquery',
      'backbone': 'underscore',
      'jquery-mousewheel': 'jquery'
    },
    bowerOptions: {
      relative: false
    }
  }
}
```

## Changelog

The changelog can be found on the [Releases page](https://github.com/sapegin/grunt-bower-concat/releases).

---

## License

The MIT License, see the included [License.md](License.md) file.

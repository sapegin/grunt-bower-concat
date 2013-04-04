# Bower components concatenator for Grunt [![Build Status](https://travis-ci.org/sapegin/grunt-bower-concat.png)](https://travis-ci.org/sapegin/grunt-bower-concat)

**Experimental**. Grunt task for automatically concat all installed [Bower](https://github.com/twitter/bower) components.


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

Inside your `Gruntfile.js` file add a section named `bower`. See Parameters section below for details.


### Parameters

#### dest `String`

Name of file where result of concatenation will be saved.

#### [exclude] `String|Array`

List of components you want to exclude.

#### [include] `String|Array`

By default `bower-concat` include all installed in project components. Using `include` option you can manually specify which components should be included.

### [dependencies] `Object`

Unfortunately not all Bower components list their dependencies. If comoponents concatenates in wrong order use this option to manually specify dependencies for some components.


### Config Example

``` javascript
bower: {
  all: {
    dest: 'build/_bower.js',
    exclude: 'jquery'
    dependencies: {
      'backbone': 'underscore',
      'jquery-mousewheel': 'jquery'
    }
  }
}
```

## Release History

### 2013-04-05 v0.1.0

* Initial release.

---

## License

The MIT License, see the included `License.md` file.

'use strict';

/*jshint node:true*/
var fs = require('fs');
var grunt = require('grunt');
var assert = require('assert');

describe('grunt-bower-concat', function() {
	var bowerDir = 'bwr/components';
	var files = [
		bowerDir + '/underscore/underscore.js',
		bowerDir + '/backbone/backbone.js',
		bowerDir + '/jquery-mousewheel/jquery.mousewheel.js',
		bowerDir + '/social-likes/social-likes.min.js',
		bowerDir + '/svg.js/dist/svg.js'
	];

	describe('basic', function() {
		var dest = 'test/tmp/basic.js';

		it('Should create destination file.', function() {
			assert.ok(fs.existsSync(dest), 'Dest file exists.');
			assert.ok(fs.statSync(dest).size, 'Dest file not empty.');
		});

		it('Should concatenate Bower components in right order.', function() {
			var expected = grunt.util._.map(files, grunt.file.read).join(grunt.util.linefeed);
			var actual = grunt.file.read(dest);
			assert.equal(actual, expected, 'Concatenatenation works.');
		});
	});

	describe('nonrelative', function() {
		var dest = 'test/tmp/nonrelative.js';

		it('Should create destination file.', function() {
			assert.ok(fs.existsSync(dest), 'Dest file exists.');
			assert.ok(fs.statSync(dest).size, 'Dest file not empty.');
		});

		it('Should concatenate Bower components in right order.', function() {
			var expected = grunt.util._.map(files, grunt.file.read).join(grunt.util.linefeed);
			var actual = grunt.file.read(dest);
			assert.equal(actual, expected, 'Concatenatenation works.');
		});
	});

	describe('callback', function() {
		var dest = 'test/tmp/callback.js';
		var files = [
			bowerDir + '/underscore/underscore.js',
			bowerDir + '/backbone/backbone.js',
			bowerDir + '/jquery-mousewheel/jquery.mousewheel.js',
			bowerDir + '/social-likes/social-likes.min.js',
			bowerDir + '/svg.js/dist/svg.min.js'
		];

		it('Should create destination file.', function() {
			assert.ok(fs.existsSync(dest), 'Dest file exists.');
			assert.ok(fs.statSync(dest).size, 'Dest file not empty.');
		});

		it('Should concatenate Bower components in right order.', function() {
			var expected = grunt.util._.map(files, grunt.file.read).join(grunt.util.linefeed);
			var actual = grunt.file.read(dest);
			assert.equal(actual, expected, 'Concatenatenation works.');
		});
	});

	describe('with-css', function() {
		var jsDest = 'test/tmp/with-css.js';
		var cssDest = 'test/tmp/with-css.css';

		var jsFiles = [
			bowerDir + '/underscore/underscore.js',
			bowerDir + '/backbone/backbone.js',
			bowerDir + '/jquery-mousewheel/jquery.mousewheel.js',
			bowerDir + '/social-likes/social-likes.min.js',
			bowerDir + '/svg.js/dist/svg.js'
		];
		var cssFiles = [
			bowerDir + '/social-likes/social-likes.css'
		];

		it('Should create destination files.', function() {
			assert.ok(fs.existsSync(jsDest), 'JS dest file exists.');
			assert.ok(fs.existsSync(cssDest), 'CSS dest file exists.');

			assert.ok(fs.statSync(jsDest).size, 'JS dest file not empty.');
			assert.ok(fs.statSync(cssDest).size, 'CSS dest file not empty.');
		});

		it('Should concatenate Bower JS components in right order.', function() {
			var expected = grunt.util._.map(jsFiles, grunt.file.read).join(grunt.util.linefeed);
			var actual = grunt.file.read(jsDest);
			assert.equal(actual, expected, 'JS concatenatenation works.');
		});

		it('Should concatenate Bower CSS components in right order.', function() {
			var expected = grunt.util._.map(cssFiles, grunt.file.read).join(grunt.util.linefeed);
			var actual = grunt.file.read(cssDest);
			assert.equal(actual, expected, 'CSS concatenatenation works.');
		});
	});

	describe('only-css', function() {
		var cssDest = 'test/tmp/with-css.css';

		var cssFiles = [
			bowerDir + '/social-likes/social-likes.css'
		];

		it('Should create destination file.', function() {
			assert.ok(fs.existsSync(cssDest), 'CSS dest file exists.');
			assert.ok(fs.statSync(cssDest).size, 'CSS dest file not empty.');
		});

		it('Should concatenate Bower CSS components in right order.', function() {
			var expected = grunt.util._.map(cssFiles, grunt.file.read).join(grunt.util.linefeed);
			var actual = grunt.file.read(cssDest);
			assert.equal(actual, expected, 'CSS concatenatenation works.');
		});
	});
});

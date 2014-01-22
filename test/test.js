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
});

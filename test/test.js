'use strict';

/*jshint node:true*/
var grunt = require('grunt');
var assert = require('assert');

describe('grunt-bower-concat', function() {
	var dest = 'test/tmp/_bower.js';
	var files = [
		'bower_components/underscore/underscore.js',
		'bower_components/backbone/backbone.js',
		'bower_components/jquery-mousewheel/jquery.mousewheel.js',
		'bower_components/social-likes/social-likes.min.js'
	];

	it('Should create destination file.', function() {
		assert.ok(grunt.file.exists(dest), 'Dest file exists.');
	});

	it('Should concatenate Bower components in right order.', function() {
		var expected = grunt.util._.map(files, grunt.file.read).join(grunt.util.linefeed);
		// grunt.file.write('test/tmp/exp.js', expected);
		var actual = grunt.file.read(dest);
		assert.equal(actual, expected, 'Concatenatenation works.');
    });
});

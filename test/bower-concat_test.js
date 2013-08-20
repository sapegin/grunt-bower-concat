'use strict';

/*jshint node:true*/
var grunt = require('grunt');

exports.bower = {
	test1: function(test) {
		var dest = 'test/tmp/_bower.js';
		var files = [
			'bower_components/underscore/underscore.js',
			'bower_components/social-likes/social-likes.min.js',
			'bower_components/jquery-mousewheel/jquery.mousewheel.js',
			'bower_components/backbone/backbone.js'
		];

		// Destination file exists
		test.ok(grunt.file.exists(dest), 'Dest file exists.');

		// Concatenation works
		var expected = grunt.util._.map(files, grunt.file.read).join(grunt.util.linefeed);
		var actual = grunt.file.read(dest);
		test.equal(actual, expected, 'Concatenatenation works.');

		test.done();
	}
};

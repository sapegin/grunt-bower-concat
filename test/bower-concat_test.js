'use strict';

/*jshint node:true*/
var grunt = require('grunt');

exports.bower = {
	test1: function(test) {
		var dest = 'test/tmp/_bower.js';
		var files = [
			'components/underscore/underscore.js',
			'components/social-likes/social-likes.min.js',
			'components/jquery-mousewheel/jquery.mousewheel.js',
			'components/ember-data/packages/ember-data/lib/core.js',
			'components/ember-data/packages/ember-data/lib/ext.js',
			'components/ember-data/packages/ember-data/lib/system/store.js',
			'components/ember-data/packages/ember-data/lib/system/record_arrays.js',
			'components/ember-data/packages/ember-data/lib/system/model.js',
			'components/ember-data/packages/ember-data/lib/system/relationships.js',
			'components/ember-data/packages/ember-data/lib/system/application_ext.js',
			'components/ember-data/packages/ember-data/lib/system/serializer.js',
			'components/ember-data/packages/ember-data/lib/system/adapter.js',
			'components/ember-data/packages/ember-data/lib/adapters.js',
			'components/backbone/backbone.js'
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

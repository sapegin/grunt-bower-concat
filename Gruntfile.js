/*jshint node:true*/
module.exports = function(grunt) {
	'use strict';

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	grunt.initConfig({
		bower_concat: {
			all: {
				dest: 'test/tmp/_bower.js',
				exclude: 'jquery',
				dependencies: {
					'backbone': 'underscore',
					'jquery-mousewheel': 'jquery'
				}
			}
		},
		mochaTest: {
			test: {
				options: {
					reporter: 'spec'
				},
				src: ['test/*.js']
			}
		},
		jshint: {
			all: 'tasks/*.js',
			options: {
				jshintrc: '.jshintrc'
			}
		},
		clean: ['test/tmp']
	});

	grunt.loadTasks('tasks');

	grunt.registerTask('test', ['mochaTest']);
	grunt.registerTask('default', ['jshint', 'clean', 'bower_concat', 'test', 'clean']);

};

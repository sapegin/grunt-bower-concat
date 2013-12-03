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
				},
				mainFiles: {
				  'svg.js': 'dist/svg.js'
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
			options: {
				jshintrc: '.jshintrc'
			},
			all: [
				'tasks/**/*.js',
				'lib/**/*.js'
			],
		},
		jscs: {
			all: [
				'tasks/**/*.js',
				'lib/**/*.js'
			],
		},
		clean: ['test/tmp']
	});

	grunt.loadTasks('tasks');

	grunt.registerTask('test', ['mochaTest']);
	grunt.registerTask('default', ['jshint', 'jscs', 'clean', 'bower_concat', 'test', 'clean']);
	grunt.registerTask('build', ['default']);
};

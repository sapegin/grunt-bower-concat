/*jshint node:true*/
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		bower: {
			all: {
				dest: 'test/tmp/_bower.js',
				exclude: 'jquery',
				dependencies: {
					'backbone': 'underscore',
					'jquery-mousewheel': 'jquery'
				}
			}
		},
		nodeunit: {
			all: ['test/bower-concat_test.js']
		},
		jshint: {
			all: ['Gruntfile.js', 'tasks/*.js', 'test/*.js'],
			options: {
				jshintrc: '.jshintrc'
			}
		},
		clean: ['test/tmp']
	});

	grunt.loadTasks('tasks');

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('default', ['jshint', 'clean', 'bower', 'nodeunit', 'clean']);

};

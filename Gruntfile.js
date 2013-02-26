/*jshint node:true*/
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		bower: {
			all: {
				exclude: 'jquery',
				dest: 'build/_bower.js',
				dependencies: {
					'backbone': 'underscore',
					'jquery-mousewheel': 'jquery'
				}
			}
		},
		concat: {
			test1: {
				src: [
					'<%= bower.dest %>',
					'test/js/utils.js',
					'test/js/main.js'
				],
				dest: 'build/scripts.js'
			}
		},
		nodeunit: {
			all: ['test/bower-concat_test.js']
		},
		jshint: {
			all: ['Gruntfile.js', 'tasks/*.js', 'test/*.js'],
			options: {
				node: true,
				white: false,
				smarttabs: true,
				eqeqeq: true,
				immed: true,
				latedef: false,
				newcap: true,
				undef: true
			}
		},
		clean: ['test/tmp']
	});

	grunt.loadTasks('tasks');

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('default', ['jshint', 'clean', 'bower', 'concat', 'nodeunit', 'clean']);
	//grunt.registerTask('tt', ['bower', 'concat']);

};

/*jshint node:true*/
module.exports = function(grunt) {
	'use strict';

	var _ = require('lodash');

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		bower_concat: {
			basic: {
				dest: 'test/tmp/basic.js',
				exclude: 'jquery',
				dependencies: {
					'backbone': 'underscore',
					'jquery-mousewheel': 'jquery'
				},
				mainFiles: {
				  'svg.js': 'dist/svg.js'
				}
			},
			nonrelative: {
				dest: 'test/tmp/nonrelative.js',
				exclude: 'jquery',
				dependencies: {
					'backbone': 'underscore',
					'jquery-mousewheel': 'jquery'
				},
				mainFiles: {
				  'svg.js': 'dist/svg.js'
				},
				bowerOptions: {
					relative: false
				}
			},
			callback: {
				dest: 'test/tmp/callback.js',
				exclude: 'jquery',
				dependencies: {
					'backbone': 'underscore',
					'jquery-mousewheel': 'jquery'
				},
				mainFiles: {
				  'svg.js': 'dist/svg.js'
				},
				callback: function(mainFiles, component) {
					return _.map(mainFiles, function(filepath) {
						var min = filepath.replace(/\.js$/, '.min.js');
						return grunt.file.exists(min) ? min : filepath;
					});
				}
			},
			withCss: {
				dest: {
					js: 'test/tmp/with-css.js',
					css: 'test/tmp/with-css.css'
				},
				exclude: 'jquery',
				dependencies: {
					'backbone': 'underscore',
					'jquery-mousewheel': 'jquery'
				},
				mainFiles: {
				  'svg.js': 'dist/svg.js',
				  'social-likes': ['social-likes.min.js', 'social-likes.css']
				}
			},
			onlyCss: {
				dest: {
					css: 'test/tmp/with-css.css'
				},
				exclude: 'svg.js',
				mainFiles: {
				  'social-likes': ['social-likes.css']
				}
			},
			scss: {
				dest: {
					scss: 'test/tmp/scss.scss'
				}
			},
			include: {
				dest: 'test/tmp/include.js',
				include: [
					'backbone',
					'jquery-mousewheel'
				],
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
				src: ['./test/lib/*.js', './test/*.js']
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

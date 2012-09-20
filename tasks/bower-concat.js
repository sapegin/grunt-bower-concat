/**
 * Concat wrapper with Bower support
 *
 * @author Artem Sapegin (http://sapegin.me)
 */

// @todo Some (bad) components can import other files from main file.
// @todo References support: <bower:@about>.
// @todo Dependencies support.


/*jshint node:true */
module.exports = function(grunt) {
	'use strict';

	// @todo Ditch this when grunt v0.4 is released
	grunt.util = grunt.util || grunt.utils;

	var fs = require('fs'),
		path = require('path'),
		bower = require('bower');

	// Override default concat task
	grunt.renameTask('concat', '_concat');
	grunt.registerTask('concat', 'bower-concat _concat');

	grunt.registerTask('bower-concat', 'Concat wrapper with Bower support.', function() {
		function process(bowerFiles) {
			for (var subtaskName in concatConfig) {
				var subtask = concatConfig[subtaskName],
					newSrc = [];
				for (var fileIdx in subtask.src) {
					var file = subtask.src[fileIdx];
					if (file.bower) {
						var filesList = [];
						for (var fileId in bowerFiles) {
							if (file.include.length && !inArray(fileId, file.include)) continue;
							if (file.exclude.length && inArray(fileId, file.exclude)) continue;
							newSrc.push(path.resolve(bowerFiles[fileId]));
						}
					}
					else {
						newSrc.push(file);
					}
				}
				subtask.src = newSrc;
			}

			//console.log(concatConfig)

			grunt.config.set('_concat', concatConfig);
			done();
		}

		var concatConfig = parseConfig(grunt.config.get('concat'));
		if (!concatConfig) return;

		var done = this.async();
		grunt.helper('bower-list', process);
	});

	grunt.registerHelper('bower-list', function(callback) {
		bower.commands.list({ paths: true })
			.on('error', grunt.fatal.bind(grunt.fail))
			.on('data', function(components) {
				for (var name in components) {
					var filepath = components[name];

					if (isJsFile(filepath)) continue;  // Bower knows main file

					var files = fs.readdirSync(filepath),
						jsFiles = [];
					for (var fileIdx in files) {
						var file = files[fileIdx];
						if (isJsFile(file))
							jsFiles.push(file);
					}

					if (jsFiles.length === 1) {  // Only one JS file: no doubt it main file
						components[name] = path.join(filepath, jsFiles[0]);
					}
					else {
						// @todo check concat task
						//grunt.fatal('Bower: can’t detect main file for "' + name + '" component. ' +
							//'You should add it manually to concat task.');
					}
				}

				callback(components);
			});
	});

	function isJsFile(filepath) {
		return path.extname(filepath) === '.js';
	}

	function parseConfig(cfg) {
		var found = false;
		for (var subtaskName in cfg) {
			var subtask = cfg[subtaskName],
				src = Array.isArray(subtask.src) ? subtask.src : [subtask.src],
				newSrc = [];
			for (var fileIdx in src) {
				var file = src[fileIdx],
					m = file.match(/^<bower:([^>]+)>$/);
				if (m) {
					found = true;
					var options = m[1];
						file = {
							bower: true,
							include: [],
							exclude: []
						};
					if (options !== 'all') {
						options = options.split(/[,; ]+/);
						for (var optionIdx in options) {
							var option = options[optionIdx];
							if (option.slice(0, 1) === '-') {
								file.exclude.push(option.slice(1));
							}
							else {
								file.include.push(option);
							}
						}
					}
				}
				newSrc.push(file);
			}
			subtask.src = newSrc;
		}

		return found ? cfg : null;
	}

	function inArray(needle, haystack) {
		for (var key in haystack) {
			if (haystack[key] === needle) {
				return true;
			}
		}
		return false;
	}

};

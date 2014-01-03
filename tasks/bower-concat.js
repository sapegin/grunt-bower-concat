/**
 * Concatenate installed Bower packages
 *
 * @author Artem Sapegin (http://sapegin.me)
 */


/*jshint node:true */
module.exports = function(grunt) {
	'use strict';

	var path = require('path');
	var fs = require('fs');
	var bower = require('bower');
	var detective = require('detective');
	var _ = require('lodash');
	_.str = require('underscore.string');
	var dependencyTools = require('../lib/dependencyTools');

	grunt.registerMultiTask('bower_concat', 'Concatenate installed Bower packages.', function() {
		// Options
		this.requiresConfig([this.name, this.target, 'dest'].join('.'));
		var dest = this.data.dest;
		var includes = ensureArray(this.data.include || []);
		var excludes = ensureArray(this.data.exclude || []);
		var dependencies = this.data.dependencies || {};
		var mains = this.data.mainFiles || {};
		var bowerOptions = this.data.bowerOptions || {};

		var done = this.async();

		bowerJavaScripts(function(bowerFiles) {
			// Concatenate
			var src = bowerFiles.join(grunt.util.linefeed);

			// Write result
			grunt.file.write(dest, src);
			grunt.log.writeln('File ' + dest.cyan + ' created.');

			done();
		});

		function bowerJavaScripts(allDone) {
			grunt.util.async.parallel({
				map: bowerList('map'),
				components: bowerList('paths')
			}, function(err, lists) {
				// Ensure all manual defined dependencies are contained in an array
				if (dependencies) {
					_.map(dependencies, function(value, key) {
						dependencies[key] = ensureArray(value);
					});
				}

				// Resolve dependency graph to ensure correct order of components when concat them
				var resolvedDependencies = resolveDependencies(lists.map);

				// List of main files
				var jsFiles = {};
				_.each(lists.components, function(component, name) {
					if (includes.length && _.indexOf(includes, name) === -1) return;
					if (excludes.length && _.indexOf(excludes, name) !== -1) return;

					var mainFiles = findMainFiles(name, component);

					if (mainFiles.length) {
						jsFiles[name] = mainFiles.map(function(file) {
							return grunt.file.read(file);
						});
					}
					else {
						// Try to find and concat minispade package: packages/_name_/lib/main.js
						var pkg = getNpmPackage(name, component);
						if (pkg) {
							jsFiles[name] = pkg;
						}
						else {
							grunt.fail.fatal('Can’t detect main file for "' + name + '" component. ' +
								'You should explicitly define it via bower_concat’s mainFiles option. ' +
								'See Readme for details.'
								);
						}
					}
				});

				// Gather JavaScript files by respecting the order of resolved dependencies
				var modules = [];
				_.each(resolvedDependencies, function(name) {
					if (jsFiles[name]) {
						modules = modules.concat(jsFiles[name]);
					}
				});

				allDone(modules);
			});
		}

		// Should be used inside grunt.util.async.parallel
		function bowerList(kind) {
			return function(callback) {
				var params = _.extend({}, bowerOptions);
				params[kind] = true;

				bower.commands.list(params)
					.on('error', grunt.fail.fatal.bind(grunt.fail))
					.on('end', function(data) {
						callback(null, data);  // null means "no error" for async.parallel
					});
			};
		}

		function resolveDependencies(map) {
			var dependencyGraph = dependencies || {};
			var resolved = [];
			var unresolved = [];

			// Build dependency graph:
			if (map.dependencies) {
				dependencyTools.buildDependencyGraph(
					undefined,  // First recursion without a start value
					map.dependencies,
					dependencyGraph
				);

				// Flatten/resolve the dependency tree:
				dependencyTools.resolveDependencyGraph(
					undefined,  // First recursion without a start value
					resolved,
					unresolved,
					dependencyGraph
				);
			}

			return resolved;
		}

		function findMainFiles(name, component) {
			// Main file explicitly defined in bower_concat options
			if (mains[name]) {
				var manualMainFiles = ensureArray(mains[name]);
				manualMainFiles = ensureArray(manualMainFiles.map(function(filepath) {
					if(component.substr(0,bower.config.cwd.length) === bower.config.cwd){
						return path.join(component, filepath);
					} else {
						return path.join(bower.config.cwd, component, filepath);
					}
				}));
				return manualMainFiles;
			}

			// Bower knows main JS file?
			var mainFiles = ensureArray(component);
			mainFiles = mainFiles.map(function(filepath) {
				if(filepath.substr(0,bower.config.cwd.length) === bower.config.cwd){
					return filepath;
				} else {
					return path.join(bower.config.cwd, filepath);
				}
			});

			var mainJSFiles = _.filter(mainFiles, isJsFile);
			if (mainJSFiles.length) {
				return mainJSFiles;
			}

			// Try to find main JS file
			var jsFiles = [];
			if(component && component instanceof Array && component.length > 0){
				jsFiles = component.map(function(filepath){
					if(filepath.substr(0,bower.config.cwd.length) === bower.config.cwd){
						return grunt.file.expand(path.join(filepath, '*.js'));
					} else {
						return grunt.file.expand(path.join(bower.config.cwd, filepath, '*.js'));
					}
				});
			} else if(component.substr(0,bower.config.cwd.length) === bower.config.cwd){
				jsFiles = grunt.file.expand(path.join(component, '*.js'));
			} else {
				grunt.file.expand(path.join(bower.config.cwd, component, '*.js'));
			}

			// Skip Gruntfiles
			jsFiles = _.filter(jsFiles, function(filepath) {
				return !/(Gruntfile\.js)|(grunt\.js)$/.test(filepath);
			});

			if (jsFiles.length === 1) {
				// Only one JS file: no doubt it’s main file
				return jsFiles;
			}
			else {
				// More than one JS file: try to guess
				var bestFile = guessBestFile(name, jsFiles);
				if (bestFile) {
					return [bestFile];
				}
				else {
					return [];
				}
			}
		}

		function getNpmPackage(name, component) {
			var pkg = findPackage(name, component);
			if (!pkg) return null;

			var mainjs = path.join(pkg, 'lib/main.js');
			if (!fs.existsSync(mainjs)) return null;

			return requirePackage(pkg, mainjs);
		}

		function findPackage(name, component) {
			var packages = grunt.file.expand(path.join(component, 'packages/*'));
			if (packages.length === 0) {
				// No packages found
				return null;
			}
			else if (packages.length === 1) {
				// Only one package: return it
				return packages[0];
			}
			else {
				// More than one package: try to guess
				return guessBestFile(name, packages);
			}
		}

		function requirePackage(pkg, mainjs) {
			var processed = {};
			var pkgName = path.basename(pkg);
			var code = grunt.file.read(mainjs);
			while (true) {
				var requires = detective(code);
				if (!requires.length) break;
				for (var requireIdx in requires) {
					var name = requires[requireIdx];
					var requiredCode = '';
					if (!processed[name]) {
						var filepath = path.join(pkg, 'lib', name.replace(pkgName + '/', '') + '.js');
						requiredCode = grunt.file.read(filepath);
						processed[name] = true;
					}
					code = code.replace(new RegExp('require\\([\\\'\"]' + name + '[\\\'\"]\\);?'), requiredCode);
				}
			}
			return code;
		}

		// Computing Levenshtein distance to guess a main file
		// Based on https://github.com/curist/grunt-bower
		function guessBestFile(componentName, files) {
			var minDist = 1e13;
			var minDistIndex = -1;

			files.sort(function(a, b) {
				// Reverse order by path length
				return b.length - a.length;
			});

			files.forEach(function(filepath, i) {
				var filename = path.basename(filepath, '.js');
				var dist = _.str.levenshtein(componentName, filename);
				if (dist <= minDist) {
					minDist = dist;
					minDistIndex = i;
				}
			});

			if (minDistIndex !== -1) {
				return files[minDistIndex];
			}
			else {
				return undefined;
			}
		}

		function ensureArray(object) {
			if (Array.isArray(object))
				return object;
			else
				return [object];
		}

		function isJsFile(filepath) {
			return typeof filepath === 'string' && fs.existsSync(filepath) && fs.lstatSync(filepath).isFile() && path.extname(filepath) === '.js';
		}

	});
};

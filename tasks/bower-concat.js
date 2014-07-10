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
	var async = require('async');
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
		var callback = this.data.callback;
		var bowerOptions = this.data.bowerOptions || {};
		var bowerDir = bowerOptions.relative !== false ? bower.config.cwd : '';

		var done = this.async();

		bowerJavaScripts(function(bowerFiles) {
			// Concatenate
			var src = bowerFiles.join(grunt.util.linefeed);

			// Write result
			grunt.file.write(dest, src);
			grunt.log.writeln('File ' + dest.cyan + ' created.');

			done();
		});


		/**
		 * Finds suitable JS files for all installed Bower packages.
		 *
		 * @param {Function} allDone function(bowerFiles) {}
		 */
		function bowerJavaScripts(allDone) {
			async.parallel({
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

					var mainFiles = findMainFiles(name, component, lists.map.dependencies[name]);
					if (mainFiles.length) {
						if (callback) mainFiles = callback(mainFiles, name);
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

		/**
		 * Returns function that invokes `list` command of Bower API.
		 * Should be used inside async.parallel.
		 *
		 * @param {String} kind map|paths
		 * @return {Function}
		 */
		function bowerList(kind) {
			return function(done) {
				var params = _.extend({}, bowerOptions);
				params[kind] = true;
				bower.commands.list(params, {offline: true})
					.on('error', grunt.fail.fatal.bind(grunt.fail))
					.on('end', function(data) {
						done(null, data);  // null means "no error" for async.parallel
					});
			};
		}

		/**
		 * Builds dependency graph.
		 * See lib/dependencyTools.js.
		 *
		 * @param {Object} map Map from bower.commands.list(kind: map).
		 * @return {Array}
		 */
		function resolveDependencies(map) {
			var dependencyGraph = dependencies || {};
			var resolved = [];
			var unresolved = [];

			// Build dependency graph
			if (map.dependencies) {
				dependencyTools.buildDependencyGraph(
					undefined,  // First recursion without a start value
					map.dependencies,
					dependencyGraph
				);

				// Flatten/resolve the dependency tree
				dependencyTools.resolveDependencyGraph(
					undefined,  // First recursion without a start value
					resolved,
					unresolved,
					dependencyGraph
				);
			}

			return resolved;
		}

		/**
		 * Finds main JS files for a component.
		 *
		 * @param {String} name Component name.
		 * @param {Array|String} component Item from bower.commands.list(kind: list).
		 * @param {Object} meta Item from bower.commands.list(kind: map).
		 * @return {Array}
		 */
		function findMainFiles(name, component, meta) {
			grunt.verbose.writeln();
			grunt.verbose.writeln('Finding main file for ' + name + '...');
			var mainFiles = ensureArray(component);

			// Main file explicitly defined in bower_concat options
			if (mains[name]) {
				var componentDir = meta.canonicalDir;
				var manualMainFiles = ensureArray(mains[name]);
				manualMainFiles = _.map(manualMainFiles, joinPathWith(componentDir));
				grunt.verbose.writeln('Main file was specified in bower_concat options: ' + manualMainFiles);
				return manualMainFiles;
			}

			// Bower knows main JS file?
			mainFiles = _.map(mainFiles, joinPathWith(bowerDir));
			var mainJSFiles = _.filter(mainFiles, isJsFile);
			if (mainJSFiles.length) {
				grunt.verbose.writeln('Main file was specified in bower.json: ' + mainJSFiles);
				return mainJSFiles;
			}

			// Try to find main JS file
			var jsFiles = expandForAll(component, joinPathWith(bowerDir, '*.js'));

			// Skip Gruntfiles
			jsFiles = _.filter(jsFiles, function(filepath) {
				return !/(Gruntfile\.js)|(grunt\.js)$/.test(filepath);
			});

			if (jsFiles.length === 1) {
				// Only one JS file: no doubt it’s main file
				grunt.verbose.writeln('Considering the only JS file in a component’s folder as a main file: ' + jsFiles);
				return jsFiles;
			}
			else {
				// More than one JS file: try to guess
				var bestFile = guessBestFile(name, jsFiles);
				if (bestFile) {
					grunt.verbose.writeln('Guessing the best JS file in a component’s folder: ' + [bestFile]);
					return [bestFile];
				}
				else {
					grunt.verbose.writeln('Main file not found');
					return [];
				}
			}
		}

		/**
		 * Returns concatenated npm package source code (tries to find package and concatenates source code).
		 *
		 * @param {String} name Component name.
		 * @param {Array|String} component Item from bower.commands.list(kind: list).
		 * @return {String}
		 */
		function getNpmPackage(name, component) {
			var pkg = findPackage(name, component);
			if (!pkg) return null;

			var mainjs = path.join(pkg, 'lib/main.js');
			if (!fs.existsSync(mainjs)) return null;

			return requirePackage(pkg, mainjs);
		}

		/**
		 * Returns package path (packages/component-name/).
		 *
		 * @param {String} name Component name.
		 * @param {Array|String} component Item from bower.commands.list(kind: list).
		 * @return {String}
		 */
		function findPackage(name, component) {
			var packages = expandForAll(component, joinPathWith(null, 'packages/*'));

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

		/**
		 * Returns concatenated package source code.
		 * Expands all `require()`s.
		 *
		 * @param {String} pkg Package path.
		 * @param {String} mainjs Main JS file path.
		 * @return {String}
		 */
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

		/**
		 * Computing Levenshtein distance to guess a main file.
		 * Based on https://github.com/curist/grunt-bower
		 *
		 * @param {String} componentName Component name.
		 * @param {Array} files List of all possible main files.
		 * @return {String}
		 */
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

		/**
		 * Returns an array as is, converts any other type to an array: [source].
		 *
		 * @param {Mixed} object
		 * @return {Array}
		 */
		function ensureArray(object) {
			if (Array.isArray(object))
				return object;
			else
				return [object];
		}

		/**
		 * Runs grunt.file.expand for every array item and returns combined array.
		 *
		 * @param {Array|String} array Masks (can be single string mask).
		 * @param {Function} makeMask function(mask) { return mask; }
		 * @return {Array} All found files.
		 */
		function expandForAll(array, makeMask) {
			var files = [];
			ensureArray(array).forEach(function(item) {
				files = files.concat(grunt.file.expand(makeMask(item)));
			});
			return files;
		}

		/**
		 * Path joiner function factory. Returns function that prepends `pathPart` with `prepend` and appends it with `append`.
		 *
		 * @param  {Array|String} [prepend] Path parts that will be added before `pathPart`.
		 * @param  {Array|String} [append] Path parts that will be added after `pathPart`.
		 * @return {Function} function(pathPart) {}
		 */
		function joinPathWith(prepend, append) {
			return function(pathPart) {
				// path.join(prepend..., pathPart, append...)
				var params = ensureArray(prepend || []).concat([pathPart], ensureArray(append || []));
				return path.join.apply(path, params);
			};
		}

		/**
		 * Check whether specified path exists, is a file and has .js extension.
		 *
		 * @param {String} filepath Path of a file.
		 * @return {Boolean}
		 */
		function isJsFile(filepath) {
			return typeof filepath === 'string' && path.extname(filepath) === '.js' && fs.existsSync(filepath) && fs.lstatSync(filepath).isFile();
		}

	});
};

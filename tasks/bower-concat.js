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
	var filesize = require('filesize');
	var bower = require('bower');
	var detective = require('detective');
	var async = require('async');
	var _ = require('lodash');
	_.str = require('underscore.string');
	var dependencyTools = require('../lib/dependencyTools');
	var configTools = require('../lib/configTools');

	grunt.registerMultiTask('bower_concat', 'Concatenate installed Bower packages.', function() {
		var dests = configTools.extractDestData(this.data);

		// Require at least one of [`dest`, `cssDest`, `scssDest`]
		if (Object.keys(dests).length === 0) {
			throw grunt.util.error('You should specify "dest" and/or "cssDest" properties in your Gruntfile.');
		}

		var includes = ensureArray(this.data.include || []);
		var excludes = ensureArray(this.data.exclude || []);
		var dependencies = this.data.dependencies || {};
		var mains = this.data.mainFiles || {};
		var callback = this.data.callback;
		var process = this.data.process;
		var includeDev = this.data.includeDev === true;
		var bowerOptions = this.data.bowerOptions || {};
		var bowerDir = bowerOptions.relative !== false ? bower.config.cwd : '';
		var options = this.options({
			separator: grunt.util.linefeed
		});

		var tasksOpen = dests.length;

		var done = this.async();
		dests.forEach(function(destination) {
			bowerMainFiles(destination, function(files) {
				var type = destination.assetType;
				if (type === 'js') {
					concatenateAndWriteFile(files, destination.path, options.separator);
				}
				else {
					concatenateAndWriteFile(files, destination.path);
				}
				taskFinished();
			});
		});

		/**
		 * As all Filetypes are now handled asynchronously this little helper waits
		 * until every filetype is finished and will than call done()
		 */
		function taskFinished() {
			tasksOpen--;
			if (tasksOpen === 0) {
				done();
			}
		}

		/**
		 * Concatenates and writes a file
		 *
		 * @param {Array} files File contents
		 * @param {String} destination File destination
		 * @param {String} separator Files joined on this string
		 */
		function concatenateAndWriteFile(files, destination, separator) {
			if (!destination || !files || !files.length) return;

			files = _.map(files, process);

			var src = files.join(separator || grunt.util.linefeed);
			grunt.file.write(destination, src);
			grunt.log.writeln('File ' + destination.cyan + ' created.');
		}

		/**
		 * Finds suitable JS and CSS files for all installed Bower packages.
		 *
		 * @param {Array} Array of Destination Objects [{assetType: {String}, path: {String}}]
		 * @param {Function} allDone function(bowerFiles) {}
		 */
		function bowerMainFiles(destination, allDone) {
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

				// Exclude devDependencies
				var devDependencies = lists.map.pkgMeta.devDependencies;
				if (devDependencies && !includeDev) {
					excludes = excludes.concat(Object.keys(devDependencies));
				}

				// Resolve dependency graph to ensure correct order of components when concat them
				var resolvedDependencies = resolveDependencies(lists.map);

				// List of main files
				var files = {};
				var groupStats = {};

				_.each(lists.components, function(component, name) {
					if (includes.length && _.indexOf(includes, name) === -1) return;
					if (excludes.length && _.indexOf(excludes, name) !== -1) return;

					var mainFiles = findMainFiles(name, component, lists.map.dependencies[name]);
					if (mainFiles.length) {
						if (callback) mainFiles = callback(mainFiles, name);

						var filteredMainFiles = mainFiles.filter(function(file) {
							return isFileExtension(file, '.' + destination.assetType);
						});
						if (grunt.option('verbose')) {
							groupStats[name]  = filteredMainFiles.map(_.partial(toFileStats, name));
						}

						files[name] = filteredMainFiles.map(grunt.file.read);
					}
					else {
						// Try to find and concat minispade package: packages/_name_/lib/main.js
						var pkg = getNpmPackage(name, component);
						if (pkg) {
							files[name] = pkg;
						}
						else {
							grunt.log.error('Can’t detect any .' + destination.path + ' on main files for "' +
								name + '" component. ' +
								'You should explicitly define it via bower_concat’s mainFiles option. ' +
								'See Readme for details.'
								);
						}
					}
				});

				if (grunt.option('verbose')) {
					logGroupStats(destination.assetType, resolvedDependencies, destination.path, groupStats);
					grunt.verbose.writeln();
				}

				// Gather files by respecting the order of resolved dependencies
				var modules = [];
				_.each(resolvedDependencies, function(name) {
					if (files[name]) {
						modules = modules.concat(files[name]);
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
		 * Finds main JS and CSS files for a component.
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
				var componentDir = meta && meta.canonicalDir || path.join(bowerDir, bower.config.directory, name);
				var manualMainFiles = ensureArray(mains[name]);
				manualMainFiles = _.map(manualMainFiles, joinPathWith(componentDir));
				grunt.verbose.writeln('Main file was specified in bower_concat options: ' + manualMainFiles);
				return manualMainFiles;
			}

			// Bower knows main JS file?
			mainFiles = _.map(mainFiles, joinPathWith(bowerDir));
			var mainJSFiles = _.filter(mainFiles, function(file) { return isFileExtension(file, '.js'); });
			var mainCSSFiles = _.filter(mainFiles, function(file) { return isFileExtension(file, '.css'); });
			var mainSCSSFiles = _.filter(mainFiles, function(file) { return isFileExtension(file, '.scss'); });
			var allMainFiles = mainJSFiles.concat(mainCSSFiles.concat(mainSCSSFiles));

			if (allMainFiles.length) {
				grunt.verbose.writeln('Main file was specified in bower.json: ' + allMainFiles);
				return allMainFiles;
			}

			// Try to find main JS, CSS, SCSS files
			var jsFiles = expandForAll(component, joinPathWith(bowerDir, '*.js'));
			var cssFiles = expandForAll(component, joinPathWith(bowerDir, '*.css'));
			var scssFiles = expandForAll(component, joinPathWith(bowerDir, '*.scss'));

			// Skip Gruntfiles
			jsFiles = _.filter(jsFiles, function(filepath) {
				return !/(Gruntfile\.js)|(grunt\.js)$/.test(filepath);
			});

			var mainJsFiles = [];
			if (jsFiles.length === 1) {
				// Only one JS file: no doubt it’s main file
				grunt.verbose.writeln('Considering the only JS file in a component’s folder ' +
					 'as a main file: ' + jsFiles
						);
				mainJsFiles = jsFiles;
			}
			else {
				// More than one JS file: try to guess
				var bestFile = guessBestFile(name, jsFiles);
				if (bestFile) {
					grunt.verbose.writeln('Guessing the best JS file in a component’s folder: ' + [bestFile]);
					mainJsFiles = [bestFile];
				}
				else {
					grunt.verbose.writeln('Main JS file not found');
				}
			}
			return mainJsFiles.concat(cssFiles);
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
		 * @param {String} extension Extension to check for, including the`.`.
		 * @return {Boolean}
		 */
		function isFileExtension(filepath, extension) {
			return typeof filepath === 'string' && path.extname(filepath) === extension && fs.existsSync(filepath) &&
				fs.lstatSync(filepath).isFile()
				;
		}

		/**
		 * Get size of a file in readable format.
		 *
		 * @param {String} filepath Path of a file.
		 * @param {Object} options [Optional] Filesize function flags.
		 * @return {String} Readable file size.
		 */
		function getFileSize(filepath, options) {
			var stats = fs.statSync(filepath);
			return filesize(stats.size, options);
		}

		/**
		 * Wrap filepath with related component name and file size.
		 *
		 * @param {String} componentName Name of component related to a file.
		 * @param {String} filepath Path of a file.
		 * @return {Object} fileStats
		 */
		function toFileStats(componentName, filepath) {
			return {
				src: path.relative(bowerDir, filepath),
				component: componentName,
				size: getFileSize(filepath)
			};
		}

		/**
		 * Verbose print list of files for a group.
		 *
		 * @param {String} groupName Name of a files group.
		 * @param {Array} groupOrder Order of components.
		 * @param {String} groupDest Path to result of concatenation.
		 * @param {Object} files Map of components fileStats
		 */
		function logGroupStats(groupName, groupOrder, groupDest, files) {
			if (!groupDest) {
				return false;
			}

			if (!grunt.option('no-color')) {
				groupDest = groupDest.cyan;
			}

			grunt.verbose.subhead('%s: -> %s', groupName, groupDest);

			groupOrder.forEach(function(component) {
				if (_.isArray(files[component]) && files[component].length) {
					files[component].forEach(function(file) {
						if (!grunt.option('no-color')) {
							file.component = file.component.yellow;
							file.size = file.size.green;
						}

						grunt.verbose.writeln('  ./%s [%s] - %s', file.src, file.component, file.size);
					});
				}
			});
		}
	});
};

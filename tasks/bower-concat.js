/**
 * Concat wrapper with Bower support
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
	var _ = grunt.util._;

	grunt.registerMultiTask('bower', 'Concat wrapper with Bower support.', function() {
		// Options
		this.requiresConfig([ this.name, this.target, 'dest' ].join('.'));
		var dest = this.data.dest;
		var includes = ensureArray(this.data.include || []);
		var excludes = ensureArray(this.data.exclude || []);
		var dependencies = this.data.dependencies || {};

		var done = this.async();

		bowerJavaScripts(function(bowerFiles) {
			// Concatenate
			var src = bowerFiles.join(grunt.util.linefeed);

			// Write result
			grunt.file.write(dest, src);
			grunt.log.writeln('File "' + dest + '" created.');

			done();
		}, includes, excludes, dependencies);
	});

	function bowerJavaScripts(allDone, includes, excludes, dependencies) {
		grunt.util.async.parallel({
			map: bowerList('map'),
			components: bowerList('paths')
		}, function(err, lists) {
			// Combine dependencies list
			_.each(lists.map, function(component, name) {
				if (component.dependencies && !dependencies[name]) {
					dependencies[name] = Object.keys(component.dependencies);
				}
			});

			// Convert all dependencies to arrays
			_.each(dependencies, function(deps, name) {
				dependencies[name] = ensureArray(deps);
			});

			// List of main files
			var jsFiles = {};
			_.each(lists.components, function(component, name) {
				if (includes.length && _.indexOf(includes, name) === -1) return;
				if (excludes.length && _.indexOf(excludes, name) !== -1) return;

				var main = findMainFile(name, component);
				if (main) {
					jsFiles[name] = grunt.file.read(main);
				}
				else {
					// Try to find npm (?) package: packages/_name_/lib/main.js
					var pkg = getNpmPackage(name, component);
					if (pkg) {
						jsFiles[name] = pkg;
					}
					else {
						grunt.fatal('Bower: can’t detect main file for "' + name + '" component.' +
							'You should add it manually to concat task and exclude from bower task build.');
					}
				}
			});

			// Sort by dependencies
			var modules = [];
			_.each(jsFiles, function(file, name) {
				modules.push({name: name, file: file});
			});
			modules.sort(function(a, b) {
				if (_.indexOf(dependencies[b.name], a.name) !== -1)
					return -1;
				else
					return 1;
			});
			modules = _.pluck(modules, 'file');

			allDone(modules);
		});
	}

	// Should be used inside grunt.util.async.parallel
	function bowerList(kind) {
		return function(callback) {
			var params = {};
			params[kind] = true;
			bower.commands.list(params)
				.on('error', grunt.fatal.bind(grunt.fail))
				.on('end', function(data) {
					callback(null, data);  // null means "no error" for async.parallel
				});
		};
	}

	function findMainFile(name, component) {
		// Bower knows main JS file?
		var mainFiles = ensureArray(component);
		var main = _.find(mainFiles, isJsFile);
		if (main) {
			return main;
		}

		// Try to find main JS file
		var jsFiles = grunt.file.expand(path.join(component, '*.js'));
		if (jsFiles.length === 1) {
			// Only one JS file: no doubt it’s main file
			return jsFiles[0];
		}
		else {
			// More than one JS file: try to guess
			return guessBestFile(name, jsFiles);
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
			var dist = levenshteinDistanceAux(componentName, filename);
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

	// http://en.wikipedia.org/wiki/Levenshtein_distance#Computing_Levenshtein_distance
	// Borrowed from https://github.com/curist/grunt-bower
	function levenshteinDistanceAux(str1, str2) {
		var memo = {};

		function levenshteinDistance(str1, i, len1, str2, j, len2) {
			var key = [i, len1, j, len2].join(',');
			if (memo[key] !== undefined) {
				return memo[key];
			}

			if (len1 === 0) {
				return len2;
			}
			if (len2 === 0) {
				return len1;
			}

			var cost = 0;
			if (str1[i] !== str2[j]) {
				cost = 1;
			}

			var dist = Math.min(
				levenshteinDistance(str1, i+1, len1-1, str2, j, len2) + 1,
				levenshteinDistance(str1, i, len1, str2, j+1, len2-1) + 1,
				levenshteinDistance(str1, i+1, len1-1, str2, j+1, len2-1) + cost
			);
			memo[key] = dist;

			return dist;
		}

		return levenshteinDistance(str1, 0, str1.length, str2, 0, str2.length);
	}

	function isJsFile(filepath) {
		return typeof filepath === 'string' && path.extname(filepath) === '.js';
	}

	function ensureArray(object) {
		if (Array.isArray(object))
			return object;
		else
			return [object];
	}

};

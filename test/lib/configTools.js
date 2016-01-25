'use strict';

var assert = require('assert');
var configTools = require('../../lib/configTools');


describe('lib/configTools.extractDestData', function() {

		describe('.destinationConfigExists', function() {
				it('returns true if dest key exists with String as value', function() {
						var actual = configTools.destinationConfigExists({dest: "foo"});
						assert.ok(actual);
				});

				it('returns true if at least one key exists in dest Object', function() {
						var actual = configTools.destinationConfigExists({dest: {css: 'foo'} });
						assert.ok(actual);
				});

				it('returns false if no dest key exists at all', function() {
						var actual = configTools.destinationConfigExists({foo: 'bar'});
						assert.ok(!actual);
				});
		});

		describe('.getValuesOfObject', function() {
				it('should extract all Values of an Object', function() {
						var testObject = { bar: 2, foo: 'A', 3: [1,2,3]};
						var expected = ['A', 2, [1,2,3]];
						var actual = configTools.getValuesOfObject(testObject);

						assert.deepEqual(actual, expected);
				});
		});

		describe('.extractDestData', function() {
				var getValues = configTools.getValuesOfObject;

				describe('for a given an Data Object with nested cssDest, jsDest, scssDest, fooDest', function() {
						var data = {
								dest: {
										css: "./test/tmp/dest.css",
										js: "./test/tmp/dest.js",
										scss: "./test/tmp/dest.scss",
										foo: "./test/tmp/dest.foo"
								}
						};

						var result = configTools.extractDestData(data);

						it("returns an Array with every assettype and path", function() {
								var expected = [
										{'assetType': 'css', 'path': './test/tmp/dest.css'},
										{'assetType': 'js', 'path': './test/tmp/dest.js'},
										{'assetType': 'scss', 'path': './test/tmp/dest.scss'},
										{'assetType': 'foo', 'path': './test/tmp/dest.foo'}
								];

								assert.deepEqual(result, expected);
						});

				});

				describe('for the data object described in the example at version0.6.0', function() {
						var data = {
								dest: 'build/_bower.js',
								cssDest: 'build/_bower.css',
								exclude: [
									'jquery',
									'modernizr'
								],
								dependencies: {
									'underscore': 'jquery',
									'backbone': 'underscore',
									'jquery-mousewheel': 'jquery'
								},
								bowerOptions: {
									relative: false
								}
						};
						var result = configTools.extractDestData(data);

						it('dest should be mapped to js', function() {
								assert.equal(result[0].assetType, 'js');
								assert.equal(result[0].path, 'build/_bower.js');
						});

						it('should not include other keys than js', function() {
								['css', 'cssDest', 'exclude', 'dependencies', 'bowerOptions'].forEach(function(notExpectedKey) {
										assert.equal(result[notExpectedKey], undefined, 'should not include the Key: '+notExpectedKey);
								});
						});
				});
		});
});

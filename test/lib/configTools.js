'use strict';

var assert = require('assert');
var configTools = require('../../lib/configTools');


describe('lib/configTools.extractDestData', function() {

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

        describe('for a given an Data Object with cssDest, jsDest, scssDest, fooDest', function() {
            var data = {
                cssDest: "./test/tmp/dest.css",
                jsDest: "./test/tmp/dest.js",
                scssDest: "./test/tmp/dest.scss",
                fooDest: "./test/tmp/dest.foo"
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

            it('should only extract destination css', function() {
                assert.equal(result[1].assetType, 'css');
                assert.equal(result[1].path, 'build/_bower.css');
            });

            it('should not include other keys than css and js', function() {
                ['exclude', 'dependencies', 'bowerOptions'].forEach(function(notExpectedKey) {
                    assert.equal(result[notExpectedKey], undefined, 'should not include the Key: '+notExpectedKey);
                });
            });
        });
    });
});

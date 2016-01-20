'use strict';

/**
 * Returns all dest, cssDest, jsDest, scssDest ... Configs
 *
 * @param an Array of possible configs wich should be filtered and extracted
 *
 * @return the Config prefix (or FileExtension). For example css for cssDest, or js for dest.
 */
function extractDestData(data) {
	var destinationConfigs = [];
	var matcher = /(.*)(D|d)est/;
	var filteredData = Object.keys(data).filter(function(candidate) {
		return candidate.match(matcher);
	});

	filteredData.forEach(function(key) {
		var assetType = key.replace(matcher, '$1');
		if (assetType === '') {
			assetType = 'js';
		}
		destinationConfigs.push(
			{'assetType': assetType, 'path':data[key]
		});
	});


	return destinationConfigs;
}

/**
 * Extracts all the values of an Object. For example if you pass:
 *   {'key1': 'value1', 'key2': 'value2'}
 *   it will return: ['value1', 'value2']
 *
 * @param an standart JS-Object.
 *
 * @return all the values of an object
 */
function getValues(object) {
	var values = [];
	Object.keys(object).forEach(function(key) {
		values.push(object[key]);
	});

	return values.reverse();
}


module.exports = {
	extractDestData:  extractDestData,
	getValuesOfObject: getValues
};

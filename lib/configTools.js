'use strict';


function destinationConfigExists(data) {
	if (data.dest) {
		return data.dest instanceof Object || typeof data.dest === 'string';
	}

	return false;
}

/**
 * Returns all dest, cssDest, jsDest, scssDest ... Configs
 *
 * @param an Array of possible configs wich should be filtered and extracted
 *
 * @return the Config prefix (or FileExtension). For example css for cssDest, or js for dest.
 */
function extractDestData(data) {

	if (destinationConfigExists) {
		if (data.dest instanceof Object) {
			return extractMultiDestValues(data.dest);
		}
		else {
			return extractBackportDestination(data.dest);
		}
	}

	return [];
}

function extractMultiDestValues(destinations) {
	var destinationConfigs = [];

	Object.keys(destinations).forEach(function(key) {
		destinationConfigs.push(
			{'assetType': key, 'path': destinations[key]}
		);
	});

	return destinationConfigs;
}

function extractBackportDestination(destination) {
	return [{'assetType': 'js', 'path': destination}];
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
	getValuesOfObject: getValues,
	destinationConfigExists: destinationConfigExists
};

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
 * @param {Object} an Object  of possible configs wich should be filtered and extracted
 *
 * @return {Array} the config prefix (or file extension). For example css for cssDest, or js for dest.
 */
function extractDestData(data) {

	if (destinationConfigExists(data)) {
		if (data.dest instanceof Object) {
			return extractMultiDestValues(data.dest);
		}
		else {
			return extractBackportDestination(data.dest);
		}
	}

	return [];
}

/**
 * Extract all destination values from config for the given schema:
 *	 {
 *		css: '/tmp/css.css',
 *		js: '/tmp/js.js'
 *	}
 *
 *	and will turn it into:
 *	[
 *		{'assetType': css, 'path': '/tmp/css.css},
 *		{'assetType': js, 'path': '/tmp/js.js}
 *	]
 *
 * @param {Object} of all destinations
 *
 * @return {Array}
 */
function extractMultiDestValues(destinations) {
	var destinationConfigs = [];

	Object.keys(destinations).forEach(function(key) {
		destinationConfigs.push(
			{'assetType': key, 'path': destinations[key]}
		);
	});

	return destinationConfigs;
}

/**
 * Extract the destination of the old fashioned of version 0.6.0
 * like dest: '/tmp/js.js'
 *
 * Actually this only puts the given destination into an Array of Objects to
 * fit to the new datastructure of destinations.
 *
 * @param {String} path of the JS destination file
 *
 * @return {Array} with exact one element.
 */
function extractBackportDestination(destination) {
	return [{'assetType': 'js', 'path': destination}];
}

/**
 * Extracts all the values of an Object. For example if you pass:
 *	 {'key1': 'value1', 'key2': 'value2'}
 *	 it will return: ['value1', 'value2']
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

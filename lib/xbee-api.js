/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util');

exports = module.exports;
exports.XBeeAPI = XBeeAPI;

var C       = exports.Constants = require('./constants.js');
var T       = exports.tools     = require('./tools.js');

var _options = {
  api_mode: 1,
};

function XBeeAPI(options) {
  options = options || {};
  options.__proto__ = _options;
  this.options = options;
}

/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util');

var C = require('./constants.js');

var frame_builder = exports = module.exports = {};

frame_builder[C.FRAME_TYPE.AT_COMMAND] = function(buffer, frame) {
  
};

frame_builder[C.FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE] = function(buffer, frame) {
  
};


frame_builder[C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST] = function(buffer, frame) {
  
};

frame_builder[C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST] = function(buffer, frame) {
  
};

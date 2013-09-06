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
  var length = 0;
  buffer.writeUInt8(frame.type, length++); 
  buffer.writeUInt8(frame.id || this.nextFrameId(), length++);
  buffer.write(frame.command, length, 'ascii'); length+=2;
  if (frame.commandParameter && typeof frame.commandParameter == "string") {
    buffer.write(frame.commandParameter, length, 'ascii'); length += frame.commandParameter.length; 
  } else if (frame.commandParameter && typeof frame.commandParameter == 'object') {
    for (var i=0; i < frame.commandParameter.length || 0; i++)
      buffer.writeUInt8(frame.commandParameter[i], length++);
  }
  return length;
};

frame_builder[C.FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE] = function(buffer, frame) {
  var length = frame_builder[C.FRAME_TYPE.AT_COMMAND](buffer, frame);
  buffer.writeUInt8(frame.type, 0); 
  return length;
};


frame_builder[C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST] = function(buffer, frame) {
  var length = 0;
  buffer.writeUInt8(frame.type, length++); 
  buffer.writeUInt8(frame.id || this.nextFrameId(), length++);
  buffer.write(frame.destination64, length, 'hex'); length += 8;
  buffer.write(frame.destination16 || "fffe", length, 'hex'); length += 2;
  buffer.writeUInt8(frame.remoteCommandOptions || 0x02, length++);
  buffer.write(frame.command, length, 'ascii'); length+=2;
  if (typeof frame.commandParameter == "string") {
    buffer.write(frame.commandParameter, length, 'ascii'); length += frame.commandParameter.length; 
  } else {
    for (var i=0; i < frame.commandParameter.length; i++)
      buffer.writeUInt8(frame.commandParameter[i], length++);
  }
  return length;
};

frame_builder[C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST] = function(buffer, frame) {
  var length = 0;
  buffer.writeUInt8(frame.type, length++); 
  buffer.writeUInt8(frame.id || this.nextFrameId(), length++);
  buffer.write(frame.destination64, length, 'hex'); length += 8;
  buffer.write(frame.destination16, length, 'hex'); length += 2;
  buffer.writeUInt8(frame.broadcastRadius || 0x00, length++);
  buffer.writeUInt8(frame.options || 0x00, length++);
  if (typeof frame.data == "string") {
    buffer.write(frame.data, length, 'ascii'); length += frame.data.length; 
  } else {
    for (var i=0; i < frame.data.length; i++)
      buffer.writeUInt8(frame.data[i], length++);
  }
  return length;
};

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

// returns length
function writeAny(buffer, pos, value, enc) {
  var length = 0;
  if (typeof value == "string") {
    length += buffer.write(value, pos+length, enc);
    //length += value.length; 
  } else if (typeof value == "object") {
    for (var i=0; i < value.length || 0; i++) {
      buffer.writeUInt8(value[i], pos+length);
      length++;
    }
  }
  return length;
}

frame_builder[C.FRAME_TYPE.AT_COMMAND] = function(buffer, frame) {
  var length = 0;
  buffer.writeUInt8(frame.type, length++); 
  buffer.writeUInt8(frame.id || this.nextFrameId(), length++);
  length += writeAny(buffer, length, frame.command, 'ascii');
  length += writeAny(buffer, length, frame.commandParameter, 'ascii');
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
  length += writeAny(buffer, length, frame.destination64 || C.UNKNOWN_64, 'hex');
  length += writeAny(buffer, length, frame.destination16 || C.UNKNOWN_16, 'hex');
  buffer.writeUInt8(frame.remoteCommandOptions || 0x02, length++);
  length += writeAny(buffer, length, frame.command, 'ascii');
  length += writeAny(buffer, length, frame.commandParameter, 'ascii');
  return length;
};

frame_builder[C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST] = function(buffer, frame) {
  var length = 0;
  buffer.writeUInt8(frame.type, length++); 
  buffer.writeUInt8(frame.id || this.nextFrameId(), length++);
  length += writeAny(buffer, length, frame.destination64 || C.UNKNOWN_64, 'hex');
  length += writeAny(buffer, length, frame.destination16 || C.UNKNOWN_16, 'hex');
  buffer.writeUInt8(frame.broadcastRadius || 0x00, length++);
  buffer.writeUInt8(frame.options || 0x00, length++);
  length += writeAny(buffer, length, frame.data, 'ascii');
  return length;
};


frame_builder[C.FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME] = function(buffer, frame) {
  var length = 0;
  buffer.writeUInt8(frame.type, length++); 
  buffer.writeUInt8(frame.id || this.nextFrameId(), length++);
  length += writeAny(buffer, length, frame.destination64 || C.UNKNOWN_64, 'hex');
  length += writeAny(buffer, length, frame.destination16 || C.UNKNOWN_16, 'hex');
  buffer.writeUInt8(frame.sourceEndpoint, length++);
  buffer.writeUInt8(frame.destinationEndpoint, length++);
  length += writeAny(buffer, length, frame.clusterId, 'hex');
  length += writeAny(buffer, length, frame.profileId, 'hex');
  buffer.writeUInt8(frame.broadcastRadius || 0x00, length++);
  buffer.writeUInt8(frame.options || 0x00, length++);
  length += writeAny(buffer, length, frame.data, 'ascii');
  return length;
};

frame_builder[C.FRAME_TYPE.TX_REQUEST_64] = function(buffer, frame) {
  var length = 0;
  buffer.writeUInt8(frame.type, length++); 
  buffer.writeUInt8(frame.id || this.nextFrameId(), length++);
  length += writeAny(buffer, length, frame.destination64 || C.UNKNOWN_64, 'hex');
  buffer.writeUInt8(frame.options || 0x00, length++);
  length += writeAny(buffer, length, frame.data, 'ascii');
  return length;
}

frame_builder[C.FRAME_TYPE.TX_REQUEST_16] = function(buffer, frame) {
  var length = 0;
  buffer.writeUInt8(frame.type, length++); 
  buffer.writeUInt8(frame.id || this.nextFrameId(), length++);
  length += writeAny(buffer, length, frame.destination16 || C.BROADCAST_16_XB, 'hex');
  buffer.writeUInt8(frame.options || 0x00, length++);
  length += writeAny(buffer, length, frame.data, 'ascii');
  return length;
}

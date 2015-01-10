/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';

var C = require('./constants');

var frameId = 0;

var frame_builder = module.exports = {
  nextFrameId: function nextFrameId() {
    return frameId = frameId > 0xFF ? 1 : frameId++;
  }
};

frame_builder[C.FRAME_TYPE.AT_COMMAND] = 
frame_builder[C.FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE] = function(frame, builder) {
  builder.appendUInt8(frame.type);
  builder.appendUInt8(frame.id || this.nextFrameId());
  builder.appendString(frame.command, 'ascii');
  builder.appendString(frame.commandParameter, 'ascii');
};

frame_builder[C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST] = function(frame, builder) {
  builder.appendUInt8(frame.type);
  builder.appendUInt8(frame.id || this.nextFrameId());
  builder.appendString(frame.destination64 || C.UNKNOWN_64, 'hex');
  builder.appendString(frame.destination16 || C.UNKNOWN_16, 'hex');
  builder.appendUInt8(frame.remoteCommandOptions || 0x02);
  builder.appendString(frame.command, 'ascii');
  builder.appendString(frame.commandParameter, 'ascii');
};

frame_builder[C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST] = function(frame, builder) {
  builder.appendUInt8(frame.type);
  builder.appendUInt8(frame.id || this.nextFrameId());
  builder.appendString(frame.destination64 || C.UNKNOWN_64, 'hex');
  builder.appendString(frame.destination16 || C.UNKNOWN_16, 'hex');
  builder.appendUInt8(frame.broadcastRadius || 0x00);
  builder.appendUInt8(frame.options || 0x00);
  builder.appendString(frame.data, 'ascii');
};


frame_builder[C.FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME] = function(frame, builder) {
  builder.appendUInt8(frame.type);
  builder.appendUInt8(frame.id || this.nextFrameId());
  builder.appendString(frame.destination64 || C.UNKNOWN_64, 'hex');
  builder.appendString(frame.destination16 || C.UNKNOWN_16, 'hex');
  builder.appendUInt8(frame.sourceEndpoint);
  builder.appendUInt8(frame.destinationEndpoint);
  builder.appendString(frame.clusterId, 'hex');
  builder.appendString(frame.profileId, 'hex');
  builder.appendUInt8(frame.broadcastRadius || 0x00);
  builder.appendUInt8(frame.options || 0x00);
  builder.appendString(frame.data, 'ascii');
};

frame_builder[C.FRAME_TYPE.TX_REQUEST_64] = function(frame, builder) {
  builder.appendUInt8(frame.type);
  builder.appendUInt8(frame.id || this.nextFrameId());
  builder.appendString(frame.destination64 || C.UNKNOWN_64, 'hex');
  builder.appendUInt8(frame.options || 0x00);
  builder.appendString(frame.data, 'ascii');
};

frame_builder[C.FRAME_TYPE.TX_REQUEST_16] = function(frame, builder) {
  builder.appendUInt8(frame.type);
  builder.appendUInt8(frame.id || this.nextFrameId());
  builder.appendString(frame.destination16 || C.BROADCAST_16_XB, 'hex');
  builder.appendUInt8(frame.options || 0x00);
  builder.appendString(frame.data, 'ascii');
};

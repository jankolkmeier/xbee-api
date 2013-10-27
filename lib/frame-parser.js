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

var frame_parser = exports = module.exports = {};

frame_parser[C.FRAME_TYPE.NODE_IDENTIFICATION] = function(frame, buffer) {
  frame.sender64 = frame_parser.parseAddress(buffer, 0, 8);
  frame.sender16 = frame_parser.parseAddress(buffer, 8, 2);
  frame.receiveOptions = buffer.readUInt8(10);
  frame_parser.parseNodeIdentificationPayload(frame, buffer.slice(11));
};

frame_parser[C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET] = function(frame, buffer) {
  frame.remote64 = frame_parser.parseAddress(buffer, 0, 8);
  frame.remote16 = frame_parser.parseAddress(buffer, 8, 2);
  frame.receiveOptions = buffer.readUInt8(10);
  frame.data = buffer.slice(11).toJSON();
};

frame_parser[C.FRAME_TYPE.MODEM_STATUS] = function(frame, buffer) {
  frame.modemStatus = buffer.readUInt8(0);
};

frame_parser[C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX] = function(frame, buffer) {
  frame.remote64 = frame_parser.parseAddress(buffer, 0, 8);
  frame.remote16 = frame_parser.parseAddress(buffer, 8, 2);
  frame.receiveOptions = buffer.readUInt8(10);
  frame_parser.ParseIOSamplePayload(frame, buffer.slice(11));
};

frame_parser[C.FRAME_TYPE.AT_COMMAND_RESPONSE] = function(frame, buffer) {
  frame.id = buffer.readUInt8(0);
  frame.command = String.fromCharCode(buffer.readUInt8(1), buffer.readUInt8(2));
  frame.commandStatus = buffer.readUInt8(3);
  frame.commandData = buffer.slice(4).toJSON();
  if (frame.command == "ND") {
    frame.nodeIdentification = {};
    frame_parser.parseNodeIdentificationPayload(frame.nodeIdentification, buffer.slice(4))
  }
}

frame_parser[C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE] = function(frame, buffer) {
  frame.id = buffer.readUInt8(0);
  frame.remote64 = frame_parser.parseAddress(buffer, 1, 8);
  frame.remote16 = frame_parser.parseAddress(buffer, 9, 2);
  frame.command = String.fromCharCode(buffer.readUInt8(11), buffer.readUInt8(12));
  frame.commandStatus = buffer.readUInt8(13);
  frame.commandData = buffer.slice(14).toJSON();
};

frame_parser[C.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS] = function(frame, buffer) {
  frame.id = buffer.readUInt8(0);
  frame.remote16 = frame_parser.parseAddress(buffer, 1, 2);
  frame.transmitRetryCount = buffer.readUInt8(3);
  frame.deliveryStatus = buffer.readUInt8(4);
  frame.discoveryStatus = buffer.readUInt8(5);
};




// Todo: this function has a different profile...
frame_parser.parseAddress = function(buffer, offset, length) {
  var _buffer = new Buffer(length);
  buffer.copy(_buffer, 0, offset, offset+length);
  return _buffer.toString('hex');
  // ALTERNATIVE:
  // return buffer.slice(offset,offset+length).toJSON();
};

frame_parser.parseNodeIdentificationPayload = function(frame, buffer) {
  frame.remote16 = frame_parser.parseAddress(buffer, 0, 2);
  frame.remote64 = frame_parser.parseAddress(buffer, 2, 8);
  frame.nodeIdentifier = "";
  var ni = 10; // or 11?
  while (ni < buffer.length) { // TODO
    var byte = buffer.readUInt8(ni++);
    if (byte == 0) break;
    frame.nodeIdentifier += String.fromCharCode(byte);
  }
  frame.remoteParent16 = frame_parser.parseAddress(buffer, ni, 2);
  frame.deviceType = buffer.readUInt8(ni+2);
  frame.sourceEvent = buffer.readUInt8(ni+3);
  frame.digiProfileID = frame_parser.parseAddress(buffer, ni+4, 2);
  frame.digiManufacturerID = frame_parser.parseAddress(buffer, ni+6, 2);
}

frame_parser.ParseIOSamplePayload = function(frame, buffer) {
  frame.digitalSamples = {};
  frame.analogSamples = {};

  frame.numSamples = buffer.readUInt8(0);
  var mskD = buffer.slice(1, 3).toJSON(); 
      mskD = (mskD[0] << 8) | mskD[1];
  var mskA = buffer.readUInt8(3);

  if (mskD > 0) {
    var digitalSamples = buffer.slice(4, 6).toJSON();
    var valD = (digitalSamples[0] << 8) | digitalSamples[1];
    for (var bit in C.DIGITAL_CHANNELS.MASK) {
      if ((mskD & (1 << bit)) >> bit) {
        frame.digitalSamples[C.DIGITAL_CHANNELS.MASK[bit][0]] = (valD & (1 << bit)) >> bit;
      }
    }
  }

  if (mskA > 0) {
    var analogSamples = buffer.slice(6).toJSON();
    var sampleNr = 0;
    for (var bit in C.ANALOG_CHANNELS.MASK) {
      if ((mskA & (1 << bit)) >> bit) {
        var valA = (analogSamples[sampleNr*2] << 8) | analogSamples[sampleNr*2+1];
        // Convert to mV, resolition is < 1mV, so rounding is OK
        frame.analogSamples[C.ANALOG_CHANNELS.MASK[bit][0]] = Math.round((valA * 1200) / 1023);
        sampleNr++;
      }
    }
  }
}

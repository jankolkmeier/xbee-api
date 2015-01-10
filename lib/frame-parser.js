/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';

var C = require('./constants.js');

var frame_parser = module.exports = {};

frame_parser[C.FRAME_TYPE.NODE_IDENTIFICATION] = function(frame, reader) {
  frame.sender64 = reader.nextString(8, 'hex');
  frame.sender16 = reader.nextString(2, 'hex');
  frame.receiveOptions = reader.nextUInt8();
  frame_parser.parseNodeIdentificationPayload(frame, reader);
};

frame_parser[C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET] =
frame_parser[C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX] = function(frame, reader) {
  frame.remote64 = reader.nextString(8, 'hex');
  frame.remote16 = reader.nextString(2, 'hex');
  frame.receiveOptions = reader.nextUInt8();
  frame.data = reader.restAll();
};

frame_parser[C.FRAME_TYPE.XBEE_SENSOR_READ] = function(frame, reader) {
  frame.remote64 = reader.nextString(8, 'hex');
  frame.remote16 = reader.nextString(2, 'hex');
  frame.receiveOptions = reader.nextUInt8();
  frame.sensors = reader.nextUInt8();
  frame.sensorValues = {
      AD0: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
      AD1: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
      AD2: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
      AD3: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
      T:   reader.nextUInt16BE(),
      temperature: undefined,
      relativeHumidity: undefined,
      trueHumidity: undefined,
      waterPresent: frame.sensors === 0x60
  };

  if (frame.sensors === 2 || frame.sensors === 3) {
    if (frame.sensorValues.T < 2048) {
      frame.sensorValues.temperature = frame.sensorValues.T / 16;
    } else {
      frame.sensorValues.temperature = -(frame.sensorValues.T & 0x7ff) / 16;
    }
  }

  if (frame.sensors === 1 || frame.sensors === 3) {
    frame.sensorValues.relativeHumidity = Math.round(100 *
        (((frame.sensorValues.AD3 / frame.sensorValues.AD2) -
            0.16) / (0.0062))) / 100;
  }

  if (frame.sensors === 3) {
    frame.sensorValues.trueHumidity = Math.round(100 *
        (frame.sensorValues.relativeHumidity / (1.0546 -
            (0.00216 * frame.sensorValues.temperature)))) / 100;
  }

};

frame_parser[C.FRAME_TYPE.MODEM_STATUS] = function(frame, reader) {
  frame.modemStatus = reader.nextUInt8();
};

frame_parser[C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX] = function(frame, reader) {
  frame.remote64 = reader.nextString(8, 'hex');
  frame.remote16 = reader.nextString(2, 'hex');
  frame.receiveOptions = reader.nextUInt8();
  frame_parser.ParseIOSamplePayload(frame, reader);
};

frame_parser[C.FRAME_TYPE.AT_COMMAND_RESPONSE] = function(frame, reader) {
  frame.id = reader.nextUInt8();
  frame.command = reader.nextString(2, 'ascii');
  frame.commandStatus = reader.nextUInt8();
  if (frame.command === "ND") {
    frame.nodeIdentification = {};
    frame_parser.parseNodeIdentificationPayload(frame.nodeIdentification, reader);
  } else {
    frame.commandData = reader.restAll();
  }
};

frame_parser[C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE] = function(frame, reader) {
  frame.id = reader.nextUInt8();
  frame.remote64 = reader.nextString(8, 'hex');
  frame.remote16 = reader.nextString(2, 'hex');
  frame.command = reader.nextString(2, 'ascii');
  frame.commandStatus = reader.nextUInt8();
  frame.commandData = reader.restAll();
};

frame_parser[C.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS] = function(frame, reader) {
  frame.id = reader.nextUInt8();
  frame.remote16 = reader.nextString(2, 'hex');
  frame.transmitRetryCount = reader.nextUInt8();
  frame.deliveryStatus = reader.nextUInt8();
  frame.discoveryStatus = reader.nextUInt8();
};

frame_parser[C.FRAME_TYPE.ROUTE_RECORD] = function(frame, reader) {
  frame.remote64 = reader.nextString(8, 'hex');
  frame.remote16 = reader.nextString(2, 'hex');
  frame.receiveOptions = reader.nextUInt8();
  frame.hopCount = reader.nextUInt8();
  frame.addresses = [];
  for (var i=0; i<frame.hopCount; i++) {
    frame.addresses.push(reader.nextUInt16BE());
  }
};


frame_parser.parseNodeIdentificationPayload = function(frame, reader) {
  frame.remote16 = reader.nextString(2, 'hex');
  frame.remote64 = reader.nextString(8, 'hex');

  // Extract the NI string from the buffer
  frame.nodeIdentifier = reader.nextSze('ascii');

  frame.remoteParent16 = reader.nextString(2, 'hex');
  frame.deviceType = reader.nextUInt8();
  frame.sourceEvent = reader.nextUInt8();
  frame.digiProfileID = reader.nextString(2, 'hex');
  frame.digiManufacturerID = reader.nextString(2, 'hex');
};

frame_parser.ParseIOSamplePayload = function(frame, reader) {
  frame.digitalSamples = {};
  frame.analogSamples = {};
  frame.numSamples = reader.nextUInt8();
  var mskD = reader.nextUInt16BE(); 
  var mskA = reader.nextUInt8();

  if (mskD > 0) {
    var valD = reader.nextUInt16BE();
    for (var dbit in C.DIGITAL_CHANNELS.MASK) {
      if ((mskD & (1 << dbit)) >> dbit) {
        frame.digitalSamples[C.DIGITAL_CHANNELS.MASK[dbit][0]] = (valD & (1 << dbit)) >> dbit;
      }
    }
  }

  if (mskA > 0) {
    for (var abit in C.ANALOG_CHANNELS.MASK) {
      if ((mskA & (1 << abit)) >> abit) {
        var valA = reader.nextUInt16BE();
        // Convert to mV, resolution is < 1mV, so rounding is OK
        frame.analogSamples[C.ANALOG_CHANNELS.MASK[abit][0]] = Math.round((valA * 1200) / 1023);
      }
    }
  }
};

// Series 1 Support
frame_parser[C.FRAME_TYPE.TX_STATUS] = function(frame, reader) {
  frame.id = reader.nextUInt8();
  frame.deliveryStatus = reader.nextUInt8();
};

frame_parser[C.FRAME_TYPE.RX_PACKET_64] = function(frame, reader) {
  frame.remote64 = reader.nextString(8, 'hex');
  frame.rssi = reader.nextUInt8();
  frame.receiveOptions = reader.nextUInt8();
  frame.data = reader.restAll();
};

frame_parser[C.FRAME_TYPE.RX_PACKET_16] = function(frame, reader) {
  frame.remote16 = reader.nextString(2, 'hex');
  frame.rssi = reader.nextUInt8();
  frame.receiveOptions = reader.nextUInt8();
  frame.data = reader.restAll();
};

frame_parser[C.FRAME_TYPE.RX_PACKET_64_IO] = function(frame, reader) {
  frame.remote64 = reader.nextString(8, 'hex');
  frame.rssi = reader.nextUInt8();
  frame.receiveOptions = reader.nextUInt8();
  frame.data = reader.restAll();
  // TODO: Parse I/O Data?
};

frame_parser[C.FRAME_TYPE.RX_PACKET_16_IO] = function(frame, reader) {
  frame.remote16 = reader.nextString(2, 'hex');
  frame.rssi = reader.nextUInt8();
  frame.receiveOptions = reader.nextUInt8();
  frame.data = reader.restAll();
  // TODO: Parse I/O Data?
};

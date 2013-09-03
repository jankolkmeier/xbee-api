/*
 * xbee-api 
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('../lib/xbee-api.js');
var T = require('../lib/tools.js');
var C = require('../lib/constants.js');
var events = require('events');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['MAIN'] = {
  setUp: function(done) {
    done();
  },
  tearDown: function (done) {
    done();
  },
  'Option passing': function(test) {
    test.expect(3);
    var xbeeAPI1 = new xbee_api.XBeeAPI();
    test.equal(xbeeAPI1.options.api_mode, 1, "Do default options work?");

    var options = { api_mode: 2 };
    var xbeeAPI2 = new xbee_api.XBeeAPI(options);
    // given a byte array like [3,21], convert to a decimal value.
    test.equal(xbeeAPI2.options.api_mode, 2, "Are passed options applied?");

    var xbeeAPI3 = new xbee_api.XBeeAPI();
    test.equal(xbeeAPI3.options.api_mode, 1, "Are default options left untouched?");

    test.done();
  },
};

exports['PHYSICAL'] = {
  setUp: function(done) {
    done();
  },
  tearDown: function (done) {
    done();
  },
  'todo': function(test) {
    /*
    if (false) {
      test.expect(1);

      var xbeeAPI = new xbee_api.XBeeAPI({
        raw_frames: true
      });

      // TODO: Pass com port option to nodeunit
      var serialport = new SerialPort("COM13", {
        baudrate: 57600
        parser: xbeeAPI.parse
      });

      serialport.on("open", function() {
        var query = new Buffer([ 0x7E, 0x00, 0x04, 0x08, 0x52, 0x4E, 0x4A, 0x0D]);
        serialport.write(, function(err, results) {
          test.equal(err, null, "Can we write to the port?");
        });
      });

      serialport.on("frame_raw"; function(frame) {
        test.equal(1, 1, "");
        test.done();
      });
    }
    */
    test.done();
  }
}

exports['TOOLS'] = {
  setUp: function(done) {
    done();
  },
  tearDown: function (done) {
    done();
  },
  'bArr2Dec': function(test) {
    test.expect(1);
    // given a byte array like [3,21], convert to a decimal value.
    test.equal(T.bArr2Dec([3,21]), 789);

    test.done();
  },
  'bArr2HexStr': function(test) {
    test.expect(1);
    // given a byte array like [0xff,0xfe], convert to a string representaiton in hex.
    test.equal(T.bArr2HexStr([0xff,0xfe]), 'fffe');

    test.done();

  }
};

exports['API FRAME PARSING AND BUILDING'] = {
  setUp: function(done) {
    // setup here
    // AP=1
    done();
  },
  tearDown: function (done) {
    // clean up
    done();
  },
  'AT Commands': function(test) {
    test.expect(0);
    // AT Command; 0x08; Queries ATNJ
    var expected0 = new Buffer([ 0x7E, 0x00, 0x04, 0x08, 0x52, 0x4E, 0x4A, 0x0D]);

    // AT Command - Queue Param. Value; 0x09; Queues ATBD7
    var expected1 = new Buffer([ 0x7E, 0x00, 0x05, 0x09, 0x01, 0x42, 0x44, 0x07, 0x68]);
    
    // Remote AT Command Req.; 0x17; ATBH1
    var expected2 = new Buffer([ 0x7E, 0x00, 0x10, 0x17, 0x01, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x40, 0x11, 0x22, 0xFF, 0xFE, 0x02, 0x42, 0x48, 0x01, 0xF5]);

    //test.equal(XBee_api...(), 'value', 'Should be value');
    test.done();
  },
  'AT Command Responses': function(test) {
    test.expect(0);
    //- parse command response 0x88 #

    // AT Command Response; 0x88; ATBD [OK] (no data)
    var expected0 = new Buffer([ 0x7E, 0x00, 0x05, 0x88, 0x01, 0x42, 0x44, 0x00, 0xF0 ]);

    // Remote Command Response; 0x97; ATSL [OK] 40522BAA
    var expected1 = new Buffer([ 0x7E, 0x00, 0x13, 0x97, 0x55, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x53, 0x4C, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0xF0 ]);
    
    test.done();
  },
  'Transmit Requests': function(test) {
    test.expect(0);
    // Transmit request; 0x10; sends chars: TxData1B (AP=1)
    var expected0 = new Buffer([ 0x7E, 0x00, 0x16, 0x10, 0x01, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x0A, 0x01, 0x27, 0xFF, 0xFE, 0x00, 0x00, 0x00, 0x54, 0x78, 0x44, 0x61, 0x74, 0x61, 0x30, 0x41, 0x13 ]);
    
    test.done();
  },
  'Transmit Status': function(test) {
    test.expect(0);
    // ZigBee Transmit Status; 0x8B; 0 retransmit, Success, Address Discovery
    var expected0 = new Buffer([ 0x7E, 0x00, 0x07, 0x8B, 0x01, 0x7D, 0x84, 0x00, 0x00, 0x01, 0x71 ]);

    test.done();
  },
  'Modem Status': function(test) {
    test.expect(0);
    // Modem status; 0x8A; Coordinator Started
    var expected0 = new Buffer([ 0x7E, 0x00, 0x02, 0x8A, 0x06, 0x6F ]);
    test.done();
  }, 
  'Receive Packet': function(test) {
    test.expect(0);
    // Receive Packet; 0x90; Receive packet with chars RxData
    var expected0 = new Buffer([ 0x7E, 0x00, 0x11, 0x90, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x01, 0x52, 0x78, 0x44, 0x61, 0x74, 0x61, 0x0D ]);

    test.done();
  },
  'ZigBee IO Data Sample Rx': function(test) {
    test.expect(6);
    var xbeeAPI = new xbee_api.XBeeAPI();
    var parser = xbeeAPI.parser();
    var dummy = new events.EventEmitter();

    dummy.on("frame_object", function(frame) {
      test.equal(frame.remote64, '0013a20040522baa', "Parse remote64");
      test.equal(frame.remote16, '7d84', "Parse remote16");
      test.equal(frame.receiveOptions, 1, "Parse receive options");
      test.equal(frame.numSamples, 1, "Parse number of samples");
      test.deepEqual(frame.digitalSamples, {
        "DIO2": 1,
        "DIO3": 0,
        "DIO4": 1
      }, "Parsing digital samples");
      test.deepEqual(frame.analogSamples, {
        "AD1": 644
      }, "Parse analog samples");
      test.done();
    });

    // Receive IO Data Sample; 0x92; ...
    var rawFrame = new Buffer([ 0x7E, 0x00, 0x14, 0x92, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x01, 0x01, 0x00, 0x1C, 0x02, 0x00, 0x14, 0x02, 0x25, 0xF5 ]);
    parser(dummy, Escape(rawFrame));
  },
  'Node Identification Indicator': function(test) {
    test.expect(9);
    var xbeeAPI = new xbee_api.XBeeAPI();
    var parser = xbeeAPI.parser();
    var dummy = new events.EventEmitter();

    dummy.on("frame_object", function(frame) {
      test.equal(frame.sender64, '0013a20040522baa', "Parse sender64");
      test.equal(frame.sender16, '7d84', "Parse sender16");
      test.equal(frame.receiveOptions, 2, "Parse receive options");
      test.equal(frame.remote16, '7d84', "Parse remote16");
      test.equal(frame.remote64, '0013a20040522baa', "Parse remote64");
      test.equal(frame.nodeIdentifier, " ", "Parse node identifier");
      test.equal(frame.remoteParent16, 'fffe', "Parse parent16 ");
      test.equal(frame.deviceType, 1, "Parse device type");
      test.equal(frame.sourceEvent, 1, "Parse source event");
      // digi app profile...
      test.done();
    });

    // Receive IO Data Sample; 0x95; ...
    var rawFrame = new Buffer([ 0x7E, 0x00, 0x20, 0x95, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x02, 0x7D, 0x84, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x20, 0x00, 0xFF, 0xFE, 0x01, 0x01, 0xC1, 0x05, 0x10, 0x1E, 0x1B ]);
    parser(dummy, Escape(rawFrame));
  }
};

function Escape(buffer) {
    var packetdata = buffer.toJSON();
    var res = [packetdata[0]];
    for (var p = 1; p<packetdata.length; p++) {
      if (packetdata[p] == C.START_BYTE || 
          packetdata[p] == C.ESCAPE ||
          packetdata[p] == C.XOFF ||
          packetdata[p] == C.XON) {
        res.push(C.ESCAPE);
        res.push(packetdata[p] ^ 0x20);
      } else res.push(packetdata[p]);
    }
    return new Buffer(res, 'ascii');
}

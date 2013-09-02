/*
 * xbee-api 
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';

var xbee_api = require('../lib/xbee-api.js');
var T = require('../lib/tools.js');
var C = require('../lib/constants.js');

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
}

exports['API FRAME PARSING AND BUILDING'] = {
  setUp: function(done) {
    // setup here
    // AP=1
    done();
  },
  tearDown: function (callback) {
    // clean up
    callback();
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
    test.expect(0);
    // Receive IO Data Sample; 0x92; ...
    var expected0 = new Buffer([ 0x7E, 0x00, 0x14, 0x92, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x01, 0x01, 0x00, 0x1C, 0x02, 0x00, 0x14, 0x02, 0x25, 0xF5 ]);

    test.done();
  },
  'Node Identification Indicator': function(test) {
    test.expect(0);
    // Receive IO Data Sample; 0x95; ...
    var expected0 = new Buffer([ 0x7E, 0x00, 0x20, 0x95, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x02, 0x7D, 0x84, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x20, 0x00, 0xFF, 0xFE, 0x01, 0x01, 0xC1, 0x05, 0x10, 0x1E, 0x1B ]);

    test.done();
  }
};

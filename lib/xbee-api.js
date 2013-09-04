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
var frame_parser = require('./frame-parser');
var frame_builder = require('./frame-builder');

var _options = {
  raw_frames: false,
  api_mode: 1
};

function XBeeAPI(options) {
  options = options || {};
  options.__proto__ = _options;
  this.options = options;
  this.buildState = {
    buffer: new Buffer(512, 'ascii')
  }

  this.parseState = {
    buffer: new Buffer(512, 'ascii'),
    offset: 0,         // Offset in buffer
    position: 999,     // Position in packet
    length: 0,         // Packet Length
    total: 0,          // To test Checksum
    checksum: 0x00,    // Checksum byte
    b: 0x00,           // Working byte
    escape_next: false // For escaping in AP=2
  };

  return this;
}

XBeeAPI.prototype.Escape = function(buffer) {
  // TODO
  var b = 0x00;

  if (C.ESCAPE_BYTES.indexOf(b) > -1) {
    // Write C.ESCAPE
    // Write b ^ C.ESCAPE_WITH
  } else {
    // Write b
  }

  return buffer;
}

XBeeAPI.prototype.BuildFrame = function(frame) {
  var S = this.buildState;
  S.buffer.writeUInt8(C.START_BYTE, 0);
  S.buffer.writeUInt8(0x00, 1); // MSB length
  S.buffer.writeUInt8(0x00, 2); // LSB length

  // Write payload
  var length = frame_builder[frame.type](S.buffer.slice(3), frame);

  // Update Length
  S.buffer.writeUInt8(length % 256, 2); // LSB length
  if (length > 255)
    S.buffer.writeUInt8(length >>> 8, 1); // MSB length

  // Calculate & Append Checksum
  var checksum = 0;
  for (var i = 0; i < length; i++) checksum += S.buffer[i+3];
  S.buffer.writeUInt8(255 - (checksum % 256), length+3);
 
  // We have to test if it is safe to return a buffer that references
  // this memory, as it will change as soon as the new frame is built 
  // This is assuming that the user sends down the packet directly
  // instead of keeping it around...
  //
  // Also, this is AP=1 only! For AP=2, we'd have to create
  // a new buffer anyway!
  return S.buffer.slice(0, length+4);
}

XBeeAPI.prototype.ParseFrame = function(buffer) {
  var frame = {
    type: buffer.readUInt8(0) // Read Frame Type
  };
  frame_parser[frame.type](frame, buffer.slice(1)); // Frame Type Specific Parsing
  return frame;
}


// Todo: don't drop the start byte, pckt length & checksum
// so we can truly emit the "raw" packet.
XBeeAPI.prototype.parser = function() {
  var self = this;
  var S = self.parseState;
  return function(emitter, buffer) {
    for(var i=0; i < buffer.length; i++) {
      S.b = buffer[i];

      if (S.position > 0 && S.b == C.ESCAPE) {
        S.escape_next = true;
        continue;
      }

      if (S.escape_next) {
        S.b = 0x20 ^ S.b;
        S.escape_next = false;
      }

      S.position += 1; 

      // Detected start of packet.
      if (S.b == C.START_BYTE) {
        S.position = 0;
        S.length = 0;
        S.total = 0;
        S.checksum = 0x00;
        S.offset = 0;
        S.escape_next = false;
      }

      if (S.position == 1) S.length += S.b << 8; // most sign. bit of the length
      if (S.position == 2) S.length += S.b;     // least sign. bit of the length

      if ((S.length > 0) && (S.position > 2)) {
        if (S.offset < S.length) {
          S.buffer.writeUInt8(S.b, S.offset++);
          S.total += S.b;
        } else {
          S.checksum = S.b;
        }
      }

      // Packet is complete. Parse & Emit
      if ((S.length > 0) &&
          (S.offset == S.length) &&
          (S.position == S.length + 3)) {
        if (!S.checksum === 255 - (S.total % 256)) {
          throw new Error("Checksum Mismatch", S);
        } else if (self.options.raw_frames) {
          emitter.emit("frame_raw",
                       S.buffer.slice(0, S.offset));
        } else {
          emitter.emit("frame_object",
                       self.ParseFrame(S.buffer.slice(0, S.offset)));
        }
      }
    }
  }
}

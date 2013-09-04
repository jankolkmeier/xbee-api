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
    length: 0,         // Packet Length
    total: 0,          // To test Checksum
    checksum: 0x00,    // Checksum byte
    b: 0x00,           // Working byte
    escape_next: false // For escaping in AP=2
  };

  return this;
}

XBeeAPI.prototype.Escape = function(buffer) {
  if (this.escapeBuffer == undefined)
    this.escapeBuffer = new Buffer(512, 'ascii');

  var offset = 0;
  for (var i = 0; i < buffer.length; i++) {
    if (C.ESCAPE_BYTES.indexOf(buffer[i]) > -1) {
      this.escapeBuffer.writeUInt8(C.ESCAPE, offset++);
      this.escapeBuffer.writeUInt8(buffer[i] ^ C.ESCAPE_WITH, offset++);
    } else {
      this.escapeBuffer.writeUInt8(buffer[i], offset++);
    }
  }

  return new Buffer(this.escapeBuffer.slice(0, offset));
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
 
  if (this.options.api_mode == 2)
    return this.Escape(S.buffer.slice(0, length+4));
  else
    return new Buffer(S.buffer.slice(0, length+4));
}

XBeeAPI.prototype.ParseFrame = function(buffer) {
  var frame = {
    type: buffer.readUInt8(3) // Read Frame Type
  };
  // Frame Type Specific Parsing, drop start, legth, type and checksum
  frame_parser[frame.type](frame, buffer.slice(4, buffer.length-1));
  return frame;
}


XBeeAPI.prototype.rawParser = function() {
  var self = this;
  var S = self.parseState;
  return function(emitter, buffer) {
    for(var i = 0; i < buffer.length; i++) {
      S.b = buffer[i];

      if (S.b == C.ESCAPE) {
        S.escape_next = true;
        continue;
      }

      if (S.escape_next) {
        S.b = 0x20 ^ S.b;
        S.escape_next = false;
      }

      if (S.b == C.START_BYTE) {
        S.length = 0;
        S.total = 0;
        S.checksum = 0x00;
        S.offset = 0;
        S.escape_next = false;
      }

      S.buffer.writeUInt8(S.b, S.offset++);

      if (S.offset == 2) S.length  = S.b << 8; // most sign. bit of the length
      if (S.offset == 3) S.length += S.b;     // least sign. bit of the length
      if (S.offset > 4) {
        if (S.offset < S.length+4) {
          S.total += S.b;
        } else {
          S.checksum = S.b;
        }
      }


      if (S.length > 0 && S.offset == S.length + 4) {
        if (!S.checksum === 255 - (S.total % 256)) {
          throw new Error("Checksum Mismatch", S);
        } else if (self.options.raw_frames) {
          emitter.emit("frame_raw", S.buffer.slice(0, S.offset));
        } else {
          emitter.emit("frame_object",
                       self.ParseFrame(S.buffer.slice(0, S.offset)));
        }
      }

    }
  }
}

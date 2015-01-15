/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util'),
    events = require('events'),
    BufferBuilder = require('buffer-builder'),
    BufferReader = require('buffer-reader');

exports = module.exports;

var C       = exports.constants = require('./constants.js');
var frame_parser = exports._frame_parser = require('./frame-parser');
var frame_builder = exports._frame_builder = require('./frame-builder');

BufferReader.prototype._nextSze = function(enc) {
	var res = "";
	while (this.buf[this.offset] != 0x00) {
		res += this.buf.toString(enc || 'utf8', this.offset, this.offset+1);
		this.offset++;
    }
    this.offset++;
    return  res;
}

var _options = {
  raw_frames: false,
  api_mode: 1,
  module: "Any"
};

function XBeeAPI(options) {
  events.EventEmitter.call(this);
  options = options || {};
  options.__proto__ = _options;
  this.options = options;

  this.parseState = {
    buffer: new Buffer(512),
    offset: 0,         // Offset in buffer
    length: 0,         // Packet Length
    total: 0,          // To test Checksum
    checksum: 0x00,    // Checksum byte
    b: 0x00,           // Working byte
    escape_next: false,// For escaping in AP=2
    waiting: true
  };

  return this;
}
util.inherits(XBeeAPI, events.EventEmitter);

exports.XBeeAPI = XBeeAPI;

XBeeAPI.prototype.escape = function(buffer) {
  if (this.escapeBuffer === undefined)
    this.escapeBuffer = new Buffer(512);

  var offset = 0;
  this.escapeBuffer.writeUInt8(buffer[0], offset++);
  for (var i = 1; i < buffer.length; i++) {
    if (C.ESCAPE_BYTES.indexOf(buffer[i]) > -1) {
      this.escapeBuffer.writeUInt8(C.ESCAPE, offset++);
      this.escapeBuffer.writeUInt8(buffer[i] ^ C.ESCAPE_WITH, offset++);
    } else {
      this.escapeBuffer.writeUInt8(buffer[i], offset++);
    }
  }

  return new Buffer(this.escapeBuffer.slice(0, offset));
};

XBeeAPI.prototype.buildFrame = function(frame) {
  var packet = new Buffer(512); // Packet buffer
  var payload = packet.slice(3); // Reference the buffer past the header
  var builder = new BufferBuilder(payload);

  // Let the builder fill the payload
  frame_builder[frame.type](frame, builder);

  // Calculate & Append Checksum
  var checksum = 0;
  for (var i = 0; i < builder.length; i++) checksum += payload[i];
  builder.appendUInt8(255 - (checksum % 256));
  
  // Get just the payload
  payload = payload.slice(0, builder.length);

  // Build the header at the start of the packet buffer
  builder = new BufferBuilder(packet);
  builder.appendUInt8(C.START_BYTE);
  builder.appendUInt16BE(payload.length - 1); // Sans checksum

  // Get the header and payload as one contiguous buffer
  packet = packet.slice(0, builder.length + payload.length);

  // Escape the packet, if needed
  return this.options.api_mode === 2 ? this.escape(packet) : packet;
};

// Note that this expects the whole frame to be escaped!
XBeeAPI.prototype.parseFrame = function(reader) {
  var frame = {
    type: reader.nextUInt8() // Read Frame Type
  };

  // Frame Type Specific Parsing, drop start, legth, type and checksum
  frame_parser[frame.type](frame, reader);

  return frame;
};

XBeeAPI.prototype.canParse = function(buffer) {
  var type = buffer.readUInt8(3);
  return type in frame_parser;
};

XBeeAPI.prototype.nextFrameId = function() {
  return frame_builder.nextFrameId();
};

XBeeAPI.prototype.rawParser = function() {
  var self = this;
  return function(emitter, buffer) {
    self.parseRaw(buffer);
  };
};

XBeeAPI.prototype.parseRaw = function(buffer) {
  var S = this.parseState;
  for(var i = 0; i < buffer.length; i++) {
    S.b = buffer[i];
    if (S.b === C.START_BYTE && S.waiting) {
      S.length = 0;
      S.total = 0;
      S.checksum = 0x00;
      S.offset = 0;
      S.escape_next = false;
      S.waiting = false;
    }

    if (this.options.api_mode === 2 && S.b === C.ESCAPE) {
      S.escape_next = true;
      continue;
    }

    if (S.escape_next) {
      S.b = 0x20 ^ S.b;
      S.escape_next = false;
    }

    S.buffer.writeUInt8(S.b, S.offset++);
    
    if (S.offset === 1) {
      continue;
    }

    if (S.offset === 2) {
      S.length  = S.b << 8; // most sign. bit of the length
      continue;
    }
    if (S.offset === 3) {
      S.length += S.b;     // least sign. bit of the length
      continue;
    }

    if (S.offset > 3) { // unnessary check
      if (S.offset < S.length+4) {
        S.total += S.b;
        continue;
      } else {
        S.checksum = S.b;
      }
    }

    if (S.length > 0 && S.offset === S.length + 4) {
      S.waiting = true;
      if (S.checksum !== (255 - (S.total % 256))) {
        throw new Error("Checksum Mismatch", S);
      }

      var rawFrame = S.buffer.slice(0, S.offset);
      if (this.options.raw_frames || !this.canParse(rawFrame)) {
        this.emit("frame_raw", rawFrame);
      } else {
        this.emit("frame_object", this.parseFrame(new BufferReader(rawFrame.slice(3, rawFrame.length -1))));
      }
    }
  }
};

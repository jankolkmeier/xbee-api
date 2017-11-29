/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util'),
    stream = require('stream'),
    assert = require('assert'),
    events = require('events'),
    Buffer = require('safe-buffer').Buffer,
    BufferBuilder = require('buffer-builder'),
    BufferReader = require('buffer-reader');

exports = module.exports;

var C       = exports.constants = require('./constants.js');
var frame_parser = exports._frame_parser = require('./frame-parser');
var frame_builder = exports._frame_builder = require('./frame-builder');

var _options = {
  raw_frames: false,
  api_mode: 1,
  module: "Any",
  convert_adc: true,
  vref_adc: 1200,
  parser_buffer_size: 512,
  builder_buffer_size: 512
};

function XBeeAPI(options) {
  if (!(this instanceof XBeeAPI))
    return new XBeeAPI(xbeeAPI);

  var self = this;
  this.builder = new stream.Transform( { objectMode: true } );
  this.builder._transform = function (frame, enc, cb) {
    self.builder.push(self.buildFrame(frame));
    cb();
  }

  this.parser = new stream.Transform( { objectMode: true } );
  this.parser._transform = function (chunk, enc, cb) {
    self.parseRaw.call(self, chunk, enc, cb);
  }

  events.EventEmitter.call(this);
  options = options || {};
  options.__proto__ = _options;
  this.options = options;

  this.parseState = {
    buffer: Buffer.alloc(this.options.parser_buffer_size),
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
    this.escapeBuffer = Buffer.alloc(this.options.parser_buffer_size);

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

  return Buffer.from(this.escapeBuffer.slice(0, offset));
};

XBeeAPI.prototype.buildFrame = function(frame) {
  assert(frame, 'Frame parameter must be a frame object');

  var packet = Buffer.alloc(this.options.builder_buffer_size); // Packet buffer
  var payload = packet.slice(3); // Reference the buffer past the header
  var builder = new BufferBuilder(payload);

  if(!frame_builder[frame.type])
    throw new Error('This library does not implement building the %d frame type.', frame.type);

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
XBeeAPI.prototype.parseFrame = function(rawFrame) {
  // Trim the header and trailing checksum
  var reader = new BufferReader(rawFrame.slice(3, rawFrame.length -1));

  var frame = {
    type: reader.nextUInt8() // Read Frame Type
  };

  // Frame type specific parsing.
  frame_parser[frame.type](frame, reader, this.options);

  return frame;
};

XBeeAPI.prototype.canParse = function(buffer) {
  var type = buffer.readUInt8(3);
  return type in frame_parser;
};

XBeeAPI.prototype.canBuild = function(type) {
  return type in frame_builder;
};

XBeeAPI.prototype.nextFrameId = function() {
  return frame_builder.nextFrameId();
};

XBeeAPI.prototype.rawParser = function() { // Custom parsers are supported up to Node Serialport 4.0.7
  return function(emitter, buffer) {
    this.parseRaw(buffer);
  }.bind(this);
};

XBeeAPI.prototype.newStream = function () { // Transform stream for Node Serialport 5.0.0+
  return new stream_transformer(this);
};

XBeeAPI.prototype.parseRaw = function(buffer, enc, cb) {
  var S = this.parseState;
  for(var i = 0; i < buffer.length; i++) {
    S.b = buffer[i];
    if ((S.waiting || (this.options.api_mode === 2 && !S.escape_next)) && S.b === C.START_BYTE) {
      S.buffer = Buffer.alloc(this.options.parser_buffer_size);
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

    if (!S.waiting) {
        if (S.buffer.length > S.offset) {
          S.buffer.writeUInt8(S.b, S.offset++);
        } else {
            console.warn("Packet being parsed doesn't fit allocated buffer.\n"+
                         "Consider increasing parser_buffer_size option.");
            S.waiting = true;
        }
    }
    
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
      if (S.checksum !== (255 - (S.total % 256))) {
        var err = new Error("Checksum Mismatch " + JSON.stringify(S));
        this.emit('error', err);
      }

      var rawFrame = S.buffer.slice(0, S.offset);
      if (this.options.raw_frames || !this.canParse(rawFrame)) {
        if (cb !== undefined && typeof(cb) == 'function') this.parser.push(rawFrame);
        else this.emit("frame_raw", rawFrame);
      } else {
        var frame = this.parseFrame(rawFrame);
        if (cb !== undefined && typeof(cb) == 'function') this.parser.push(frame);
        else this.emit("frame_object", frame);
      }

      // Reset some things so we don't try to reeimt the same package if there is more (bogus?) data
      S.waiting = true;
      S.length = 0;
    }
  }
  if (cb !== undefined && typeof(cb) == 'function') cb();
};

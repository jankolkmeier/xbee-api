/*jslint node: true */

'use strict';

var util = require('util');
var Transform = require('stream').Transform;
var C = require('./constants.js');

function StreamTransformer(options) {
  if (!(this instanceof StreamTransformer)) {
    return new StreamTransformer(options);
  }

  this.parseState = options.parseState;
  this.options = options.options;
  this.canParse = options.canParse;
  this.parseFrame = options.parseFrame;

  Transform.call(this, options);
}
util.inherits(StreamTransformer, Transform);

StreamTransformer.prototype._transform = function (chunk, enc, cb) {
  var S = this.parseState;
  for(var i = 0; i < chunk.length; i++) {
    S.b = chunk[i];
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
        this.push(rawFrame);
      } else {
        var frame = this.parseFrame(rawFrame);
        this.emit("frame_object", frame);
        this.push(rawFrame);
      }
      // Reset some things so we don't try to re-emit the same package if there is more (bogus?) data
      S.waiting = true;
      S.length = 0;
    }
  }
  cb();
};

module.exports = StreamTransformer;
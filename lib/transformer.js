/*jslint node: true */

'use strict';

var util = require('util');
var Transform = require('stream').Transform;
var C = require('./constants.js');

function StreamTransformer(xbeeApi) {
  if (!(this instanceof StreamTransformer)) {
    return new StreamTransformer(xbeeApi);
  }

  this.xbeeApi = xbeeApi;
  this.options = xbeeApi.options;
  this.parseState = xbeeApi.parseState;
  this.canParse = xbeeApi.canParse;
  this.parseFrame = xbeeApi.parseFrame;
  this._transform = function(chunk, enc, cb) {
    xbeeApi.parseRaw.call(this, chunk, enc, cb);
  }
  var streamOpts = {};
  streamOpts.objectMode = !xbeeApi.options.raw_frames;

  Transform.call(this, streamOpts);
}
util.inherits(StreamTransformer, Transform);

module.exports = StreamTransformer;

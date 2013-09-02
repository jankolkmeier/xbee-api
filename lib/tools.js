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

exports.dec2Hex = function(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return hex;
}

exports.bArr2HexStr = function(a) {
    var s = '';
    for(i in a) {
      s += tools.dec2Hex(a[i]);
    }
    return s;
}

exports.bArr2Str = function(a) {
  var s = '';
  for(i in a) {
    s += String.fromCharCode(a[i]);
  }
  return s;
}

exports.bArr2Dec = function(a) {
  // given a byte array like [3,21], convert to a decimal value.
  // e.g. [3,21] --> 3 * 256 + 21 = 789
  var r = 0;
  for (var i = 0; i < a.length; i++) {
    var power = a.length - i - 1;
    r += a[i] * Math.pow(256,power);
  }
  return r
}

exports.dec2bArr = function(a, m) {
  var r = [];
  while (a > 0 || r.length < m) {
    r.unshift(a & 0xff);
    a = a >> 8;
  }
  return r;
}

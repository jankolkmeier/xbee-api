# xbee-api [![Build Status](https://secure.travis-ci.org/jouz/xbee-api.png?branch=master)](http://travis-ci.org/jouz/xbee-api)

[Digi's xbee modules](http://www.digi.com/xbee) are good for quickly building low power wireless networks. They can be used to send/receive text data from serial ports of different devices. XBees can also be used alone for their on board digital and analog I/O capabilities.

**xbee-api** helps you parsing and building API frames that are used to communicate with XBee modules. **xbee-api** does *not* take care of the serial connection itself, but it is easy to hook it up to modules such as [serialport](https://github.com/voodootikigod/node-serialport/).

Note that higher-level abstraction as currently provided in [svd-xbee](https://github.com/jouz/svd-xbee/) is not part of this module anymore, but will be factored out to third modules (see [xbee-stream](https://github.com/jouz/xbee-stream/) and [xbee-stream-nodes](https://github.com/jouz/xbee-stream-nodes/), WiP).

## Getting Started
Install the module with: `npm install xbee-api`

```javascript
var xbee_api = require('xbee-api');
var C = xbee_api.constants;
var xbeeAPI = new xbee_api.XBeeAPI();

// Something we might want to send to an XBee...
var frame_obj = {
  type: C.FRAME_TYPE.AT_COMMAND,
  command: "NI",
  commandParameter: [],
};
console.log(xbeeAPI.buildFrame(frame_obj));
// <Buffer 7e 00 04 08 01 4e 49 5f>


// Something we might receive from an XBee...
var raw_frame = new Buffer([ 0x7E, 0x00, 0x13, 0x97, 0x55, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x53, 0x4C, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0xF0 ]);
console.log(xbeeAPI.parseFrame(raw_frame));
// { type: 151,
//   id: 85,
//   remote64: '0013a20040522baa',
//   remote16: '7d84',
//   command: 'SL',
//   commandStatus: 0,
//   commandData: [ 64, 82, 43, 170 ] }
```

## Documentation
...

## Examples
To combine with [serialport](https://github.com/voodootikigod/node-serialport/), we use the rawParser(). Make sure to set your baudrate, AP mode and COM port. 
```javascript
var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api.js');

var C = xbee_api.constants;

var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 1
});

var serialport = new SerialPort("COM19", {
  baudrate: 57600,
  parser: xbeeAPI.rawParser()
});

serialport.on("open", function() {
  var frame_obj = { // AT Request to be sent to 
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "NI",
    commandParameter: [],
  };

  serialport.write(xbeeAPI.buildFrame(frame_obj));
});

// All frames parsed by the XBee will be emitted here
serialport.on("frame_object", function(frame) {
	console.log(">>", frame);
});

```

See the [examples folder](https://github.com/jouz/xbee-api/tree/master/examples) in the repository for more examples.

## SUPPORTED XBEE MODELS
Both ZNet 2.5 and ZIGBEE modules should be supported. Since ZIGBEE offers more features and is more robust, you might be interested in upgrading your modules from ZNet 2.5 to ZIGBEE: [upgradingfromznettozb.pdf](ftp://ftp1.digi.com/support/documentation/upgradingfromznettozb.pdf).  
Development is done using Series 2 XBee modules with XB24-ZB (ZIGBEE) firmware. In specific, this document is used as reference: [90000976_M.pdf](http://ftp1.digi.com/support/documentation/90000976_M.pdf "http://ftp1.digi.com/support/documentation/90000976_M.pdf").

Modules must run in API mode. Both AP=1 and AP=2 modes are supported.

## License
Copyright (c) 2013 Jan Kolkmeier  
Licensed under the MIT license.

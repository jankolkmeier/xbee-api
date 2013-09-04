# xbee-api [![Build Status](https://secure.travis-ci.org/jouz/xbee-api.png?branch=master)](http://travis-ci.org/jouz/xbee-api)

[Digi's xbee modules](http://www.digi.com/xbee) are good for quickly building low power wireless networks. They can be used to send/receive text data from serial ports of different devices. XBees can also be used alone for their on board digital and analog I/O capabilities.

**xbee-api** helps you parsing and building API frames that are used to communicate with XBee modules. **xbee-api** does *not* take care of the serial connection itself, but it is easy to hook it up to modules such as [serialport](https://github.com/voodootikigod/node-serialport/).



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
_(Coming soon)_

## Examples
See the [examples folder](https://github.com/jouz/xbee-api/tree/master/examples) in the repository for more examples.

## SUPPORTED XBEE MODELS

Both ZNet 2.5 and ZIGBEE modules should be supported. Since ZIGBEE offers more features and is more robust, you might be interested in upgrading your modules from ZNet 2.5 to ZIGBEE: [upgradingfromznettozb.pdf](ftp://ftp1.digi.com/support/documentation/upgradingfromznettozb.pdf).  
Development is done using Series 2 XBee modules with XB24-ZB (ZIGBEE) firmware. In specific, this document is used as reference: [90000976_M.pdf](http://ftp1.digi.com/support/documentation/90000976_M.pdf "http://ftp1.digi.com/support/documentation/90000976_M.pdf").


## MODULE CONFIGURATION

Modules must run in API mode. Both AP=1 and AP=2 modes are supported.


## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Jan Kolkmeier  
Licensed under the MIT license.

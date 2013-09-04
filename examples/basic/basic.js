var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('../../lib/xbee-api.js');

var C = xbee_api.Constants;

var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 1
});

var serialport = new SerialPort("COM19", {
  baudrate: 57600,
  parser: xbeeAPI.rawParser()
});

serialport.on("open", function() {
  console.log("Serial port open... sending ATNJ");

      var frame = {
        type: C.FRAME_TYPE.AT_COMMAND,
        command: "NI",
        commandParameter: [],
      };

      serialport.write(xbeeAPI.BuildFrame(frame), function(err, res) {
        if (err) throw(err);
        else     console.log("written bytes: "+util.inspect(res));
      });
});


serialport.on("frame_object", function(frame) {
  console.log("OBJ> "+util.inspect(frame));
});

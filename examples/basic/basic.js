var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('../../lib/xbee-api.js');

var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 1
});

var serialport = new SerialPort("COM19", {
  baudrate: 57600,
  parser: xbeeAPI.parser()
});

serialport.on("open", function() {
  console.log("Serial port open... sending ATNJ");
  var query = new Buffer([ 0x7E, 0x00, 0x04, 0x08, 0x52, 0x4E, 0x4A, 0x0D], 'ascii');
  serialport.write(query, function(err, res) {
    if (err) console.log("write error: "+util.inspect(err));
    else     console.log("written bytes: "+util.inspect(res));
  });
});

serialport.on("frame_object", function(frame) {
  console.log("OBJ> "+util.inspect(frame));
});

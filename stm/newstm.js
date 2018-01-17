/**
* STM32 sensor module
* 	This module connects via serial port to a connected STM32 board to read sensor data and set the servo position
*   The STM32 should return the following data:
*		{ "distance" : 0, "speedms" : 0, "servoPos" : 0, "sentChar" : 0 }\n
*
*	distance => dinstance since the last time the sensor was read
*	speedms => 	current speed in meters per second
*	servoPos => current position of the servo setting the trainer resistence
*	sentChar => the servo position can be set from 0...100% and will be sent to the STM as an character followed by a newline
*				this sentChar was implemented for debugging and will show the last sent character (should be between 32 and 132)
*
*	Every sent or received data should be delimited with a newline
*
*	The current hardware consists of a STM32 board with connected CNY70 reflex sensor to sense rotational speed of the trainers roller and a servo to move the bowden cable to set the resistance.
*
* @author Richard Deininger
* @version 1.0
*/
var Settings = require('../settings.js');
var SerialPort = require('serialport');
var events = require('events');
var calc = require('../util/calc.js');
var SerialPort = require('serialport');
var port = null;
const Readline = SerialPort.parsers.Readline; // newline delimiter parser for the serialport
const parser = new Readline();


var ServoOffset = { Min : 0.2, Max: 0.9}; // max travel of the servo,... needs to be checked and set for every hardware


/**
 * Constuctor
 *  Creates a new STM instance connecting to the set serial port
 */
var STM = function(comPort)
{
	events.EventEmitter.call(this);
	var me = this;
	port = new SerialPort(comPort, { baudRate: 9600, autoOpen: false });

	this.SensorReady = function()
	{				
		this.emit('SensorReady');	
	}
	// gets every data received will parse it and trigger a "SensorData" event to forward the parsed data
	this.SensorData = function(strdata)
	{		
		try
		{
			var data = JSON.parse(strdata);
			// fallback since sometimes distance was emtpy !?? (needs to be checked on STM side)
			if (data && data.distance == 0 && data.speedms > 0)
			{
				data.distance = data.speedms;
			}
			this.emit('SensorData', data);
		} catch(e)
		{
			
		}
	}
	
	// Switches the port into "flowing mode"
	parser.on('data', function(data)
	{
		if (Settings.Data.DebugOutput)		
		{
			console.log('Data: ' + data);  
		}
		if (data.trim() != "")
        {		
			me.SensorData(data);	
		}
	});	
}

STM.prototype.__proto__ = events.EventEmitter.prototype;

/**
 * Init
 *  Initializes the module and opens the serial port
 */
STM.prototype.Init = function()
{
	ServoOffset = typeof Settings.Data.Sensors.ServoOffset  !== 'undefined' ? Settings.Data.Sensors.ServoOffset : ServoOffset;	
	ServoOffset.Delta = ServoOffset.Max - ServoOffset.Min;

	var me = this;
	port.pipe(parser);
	port.open(function (err) 
	{	
		if (err) 
		{
			return console.log('Error opening COM port: ', err.message);
		} 
		me.SensorReady();		
	});
}

/**
 * Connect
 *  Initializes the module and opens the serial port
 */
STM.prototype.Connect = function()
{	
	this.Init();	
}

/**
 * Disconnect
 *  closes the serial port
 */
STM.prototype.Disconnect = function()
{
	port.close();
}

/**
 * SetLevel
 *  Sets the new resistance level (between 0..1) and sends it to the STM32
 *  should trigger a response from the SMT32
 */
STM.prototype.SetLevel = function(pos)
{	
	// servo controller expects values from 32 to 132 (0..100%)
	pos = checkServoEndpointspos(pos);	
	var position = pos;
	pos = (pos *100) +32;		
	
	// every message has to be delimmited by an newline
	var send = String.fromCharCode(pos)+ '\n';
	if (Settings.Data.DebugOutput)
	{
		console.log("Char: %s Pos: %d  CHR: %d", send, position, send.charCodeAt(0));
	}
	port.write(send, 'ascii', function()
	{
		if (Settings.Data.DebugOutput)
		{
			console.log('data written');
		}
	});
}
 
// determined by enpoints of trainer bowden cable
var checkServoEndpointspos = function(pos)
{
	var offestPos = calc.ceil(pos /1 * ServoOffset.Delta);

	offestPos += ServoOffset.Min;
	if (offestPos > ServoOffset.Max)
	{
		offestPos = ServoOffset.Max;
	}
	if (offestPos < ServoOffset.Min)
	{
		offestPos = ServoOffset.Min;
	}
	return offestPos;
}


// export the class
module.exports = STM;
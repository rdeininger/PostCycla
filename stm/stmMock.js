/**
* STM32 sensor mockup
* 	This mockup will provide sensor data for testing
*	Constant speed can be set with the testMS variable (meters per second).. currently set to 24 km/h
*   Should provide the same data as the STM32 hardware
*	Example:
*		{ "distance" : 0, "speedms" : 0, "servoPos" : 0, "sentChar" : 0 }
*
*	distance => dinstance since the last time the sensor was read
*	speedms => 	current speed in meters per second
*	servoPos => current position of the servo setting the trainer resistence
*	sentChar => the servo position can be set from 0...100% and will be sent to the STM as an character followed by a newline
*				this sentChar was implemented for debugging and will show the last sent character (should be between 32 and 132)
*
*	For more details regarding the functionality of this module look at the "newstm.js" containing the real implementation.
* @author Richard Deininger
* @version 1.0
*/

var events = require('events');
var Settings = require('../settings.js');
var calc = require('../util/calc.js');


var testMS = 6.666;
var ServoOffset = { Min : 0.2, Max: 0.9};

var STM = function(comPort, script, tcpPort, ip)
{
	events.EventEmitter.call(this);
    this.ServerPos = 0;

	this.SensorReady = function()
	{		
		this.emit('SensorReady');	
	}

	this.SensorData = function(strdata)
	{
		var data = JSON.parse(strdata);
		this.emit('SensorData', data);
	}
}

STM.prototype.__proto__ = events.EventEmitter.prototype;

STM.prototype.Connect = function()
{
	this.Init();
}

STM.prototype.Disconnect = function()
{

}

STM.prototype.Destroy = function()
{
	
}

STM.prototype.Init = function()
{
	ServoOffset = typeof Settings.Data.Sensors.ServoOffset  !== 'undefined' ? Settings.Data.Sensors.ServoOffset : ServoOffset;	
	ServoOffset.Delta = ServoOffset.Max - ServoOffset.Min;
	var me = this;
	setTimeout(function(){
		me.SensorReady();
	},1000);
}

STM.prototype.SetLevel = function(pos)
{
		// servo controller expects values from 32 to 132	
	pos = checkServoEndpoints(pos);	
	var position = pos;
	pos = (pos *100) +32;		

	var send = String.fromCharCode(pos);
	if (Settings.Data.DebugOutput)	
	{
		console.log("Char: %s Pos: %d  CHR: %d", send, position, send.charCodeAt(0));
	}	
	this.SensorData("{ \"distance\" : "+testMS+", \"speedms\" : "+testMS+", \"servoPos\" : "+pos+", \"sentChar\" : "+send.charCodeAt(0)+" }");
}


// determined by enpoints of trainer bowden cable
var checkServoEndpoints = function(pos)
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



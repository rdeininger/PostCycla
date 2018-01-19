/**
* Ant+ sensors (heart rate and cadence)
* 	This module will encapsulate sensor data received from an Ant+ GarminStick II paired with an heart rate and cadence sensor
*	The implementation was converted from TypeScript provided by: 
*		Alessandro Vergani	https://github.com/Loghorn/ant-plus
*	The standalone cadence sensor was create by myself (was not existing)
*	
*	Example:
*		{ HeartRate: 95, Cadence : 80 }
*
* @author Richard Deininger
* @version 1.0
*/

var Settings = require('../settings.js');
var Ant = require('./antplus.js');

/**
 * Constructor
 *  Sets up the stick and paired sensors for communication
 *  Will store received data inside a variable for further use
 */
var AntSensors = function(HR_dev_id, CAD_dev_id)
{
	var me = this;
	HR_dev_id = typeof HR_dev_id  !== 'undefined' ? HR_dev_id : 30250; // fallback values for my HR sensor
	CAD_dev_id = typeof CAD_dev_id  !== 'undefined' ? CAD_dev_id : 59056; // fallback value for my cadence sensor
	this.Data = { HeartRate: 0, Cadence : 0	};

	this.stick = new Ant.GarminStick2();
	this.hrSensor = new Ant.HeartRateSensor(this.stick);
	this.cadSensor = new Ant.CadenceSensor(this.stick);

	// update hear rate when new data was sent
	this.hrSensor.on('hbdata', function (data) 
	{
		me.Data.HeartRate = data.ComputedHeartRate;		
	});
	
	// update cadence when new data was sent
	this.cadSensor.on('cadenceData', function (data) 
	{
		me.Data.Cadence = data.CalculatedCadence;
	});

	// attach sensors when stick is ready
	this.stick.on('startup', function () 
	{
		if (Settings.Data.DebugOutput)
		{
			console.log('Ant startup');
		}
		//console.log('Max channels:', this.stick.maxChannels);
		me.hrSensor.attach(0, HR_dev_id);
		me.cadSensor.attach(1, CAD_dev_id);	
		if (Settings.Data.DebugOutput)
		{
			console.log('Ant ready');
		}
	});

	
	this.stick.on('shutdown', function () 
	{
		if (Settings.Data.DebugOutput)
		{ 
			console.log('Ant shutdown'); 
		}
	});	
}

/**
 * Open
 *  connecting to the Ant+ stick and reading data from hardware paired
 */
AntSensors.prototype.Open = function()
{
	if (!this.stick.open()) 
	{
		console.log('Stick not found!');
	} 
}

/**
 * Close
 *  detaching all sensors and closing the connection
 */
AntSensors.prototype.Close = function()
{
	// this.hrSensor.detach();
	// this.cadSensor.detach();
	this.stick.detach_all();
	this.stick.close(); 
}

module.exports = AntSensors;

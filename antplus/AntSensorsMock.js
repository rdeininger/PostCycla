/**
* Ant+ sensors (heart rate and cadence) mockup
* 	This mockup will provide sensor data for testing
*	Constant cadence and heart rate can be set in the "AntSensors" function
*   Should provide the same data as the "AntSensors.js"
*	Example:
*		{ HeartRate: 95, Cadence : 80 }
**
*	For more details regarding the functionality of this module look at the "AntSensors.js" containing the real implementation.
* @author Richard Deininger
* @version 1.0
*/
var Settings = require('../settings.js');
var Ant = require('./antplus.js');

var AntSensors = function(HR_dev_id, CAD_dev_id)
{
	this.Data = { HeartRate: 95, Cadence : 80	};	
}

AntSensors.prototype.Open = function()
{
	 
}

AntSensors.prototype.Close = function()
{
	 
}

module.exports = AntSensors;

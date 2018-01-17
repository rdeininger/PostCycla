/**
* Ant+ sensors (heart rate and cadence)
* 	This encapsulates the sensors to a single module 
*	The implementation was converted from TypeScript provided by: 
*		Alessandro Vergani	https://github.com/Loghorn/ant-plus
*
* @author Richard Deininger
* @version 1.0
*/

var Ant = require('./ant.js');

//*
var HRS = require('./HeartRateSensor.js');
var CS = require('./CadenceSensor.js');
//*/
module.exports = {
	GarminStick2: Ant.GarminStick2,
	GarminStick3: Ant.GarminStick3,
	
	//*
	HeartRateSensor: HRS.HeartRateSensor,
	HeartRateScanner: HRS.HeartRateScanner,
	
	CadenceSensor: CS.CadenceSensor,
	CadenceScanner: CS.CadenceScanner
	//*/
};
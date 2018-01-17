/**
* Settings module
* 	Will automatically load settings stored inside the settings.json file
*
*   Settings json Example:
*
*{
*	"UseMockups": true,                 => if "true" PostCycla will run without the need of sensors (FOR TESTING)
*	"DebugOutput": false,               => will show more information during run in the console output
*   "PowerCalc":
*	{
*      "MinimumJoulperMeter": 16,	        => minimum joul/watt per meter (for going downhill....)    
*	    "BikeWeightKG" : 10,                => weight of bike and equipment (needed for power calculation)
*	    "RiderWeightKG" : 95,               => weight of yourself (needed for power calculation)
*       "FrontArea" :  0.55,                => frontal area, rider+bike (m^2) (original 0,509)
*       "DragCoeff" : 0.7,                  => drag coefficient Cd (original 0,63)
*       "DriveDrainLoss" : 4,               => drivetrain loss Loss_dt (original 3%)
*		"RollingResistance" : 0.005,        => coefficient of rolling resistance Crr
*       "PowerOffset" : 1.1                 => used to calculate power offset for fine tuning 1 = 100% (used in PowerCalcPostCycla.js)
*   }
*	"WebSocketPort" : 9998,             => port for the web socket (needed for client communication)
*	"HttpPort" : 8125,                  => port for the web server (needed for the client )
*	"GPXDir": "./tracks",               => path to the directory where gpx files will be read and written
*	"Smooth": 0.2,                      => parameter for gpx parsing and smoothing algorithm
*	
*	"Sensors": 
*	{
*		"HeartRate_AntId" : 30250,      => heart rate sensor Ant+ id (needed for Ant+ and pairing)
*		"Cadence_AntId": 59056,         => cadence sensor Ant+ id (needed for Ant+ and pairing)
*		"STM":
*		{
*			"ComPort" : "/dev/ttyACM0", => serial port for connection with the STM sensor
*			"ServoOffset":              => offset for min/max travel of the servo (will normally go from 0..1)
*			{ 
*				"Min" : 0.2,
*				"Max" : 0.9
*			} 
*		}
*	} 
*}  
*
* For further information about this data check the related modules.
*
* @author Richard Deininger
* @version 1.0
*/

var fs = require('fs');
var settingsfile = "./settings.json";

/**
 * Data
 *  data stored inside the settingsfile
 */
exports.Data = null;

/**
 * Load
 *  Loading settings form the "settingsfile"
 */
exports.Load = function()
{
 	exports.Data = JSON.parse(fs.readFileSync(settingsfile).toString());   
}

/**
 * Rest
 *  Reload/Reset settings form the "settingsfile"
 */
exports.Reset = function()
{
    exports.Data = JSON.parse(fs.readFileSync(settingsfile).toString()); 
}

/**
 * Save
 *  Save settings to the "settingsfile"
 */
exports.Save = function()
{
    try
    {
        fs.writefileSync(settingsfile, JSON.stringify(exports.Data)); 
    } catch(e) 
    {}
}

exports.Load(); // Load settings automatically
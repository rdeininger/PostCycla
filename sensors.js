/**
* Sensors
* 	Provides a common interface for all sensors/sensor data
*   currently only supports Ant+ and STM32/Android sensors   
*
*   Sensordata provided:
*       mps     => meters per second ...    current speed (from the STM32)
*       dist    => distance ...             distance travelled since last reading (from STM32)
*       hr      => heart rate ...           current heart (from Ant+)
        cad     => cadence ...              curent cadence (from Ant+)
        servo   => servo position           current position of the servo controlling resistance (from STM32)
*
* @author Richard Deininger
* @version 1.0
*/

var Settings = require('./settings.js');
// using sensor mocks by default for testing
var AntSensors = require('./antplus/AntSensorsMock.js');
var stm = require('./stm/stmMock.js');

if (!Settings.Data.UseMockups) //only use the real sensors when set in settings
{
    AntSensors = require('./antplus/AntSensors.js');    
    stm = require('./stm/newstm.js');
}

var SensorData = 
{
    mps: 0,
    dist: 0,
    hr:0,
    cad:0,
    servo:0
}

var sensorCallback = null;
var startCallback = null;

var antSensors = new AntSensors(Settings.Data.Sensors.HeartRate_AntId, Settings.Data.Sensors.Cadence_AntId);
var stmSensors = new stm(Settings.Data.Sensors.STM.ComPort);

stmSensors.on("SensorReady", function (data)
{    
    if (Settings.Data.DebugOutput)
    {
        console.log("Sensor Ready");
    }
    if (startCallback)
    {
        startCallback();
    }
});

stmSensors.on("SensorData", function (data)
{
    // expected data = { distance: 0.1, speedms: 0, servoPos: 0.1 }
    if (sensorCallback)
    {
        sensorCallback(readSensorData(data));
    }
});

var readSensorData = function(stmData)
{
    var data = Object.create(SensorData);

	if (stmData)
	{
		data.mps = stmData.speedms;
		data.dist = stmData.distance;		
		data.servo = stmData.servoPos;
	}
    lastread = (new Date()).getTime();
    data.hr = antSensors.Data.HeartRate;
    data.cad  = antSensors.Data.Cadence;
	//console.log("data: ",data);
    return data;        
}

exports.SetSensorDataCallback = function(callback)
{
    sensorCallback = callback;
}


// gets values from 0.0 to 1.0 (percentage of maxResistnac)
exports.SetServoPos = function(pos)
{		
	stmSensors.SetLevel(pos, false);	
}

exports.GetSensorData = function()
{
    return readSensorData();
}

exports.Start = function(stcallback)
{
    startCallback = stcallback;
    stmSensors.Connect();
    antSensors.Open();
}

exports.Stop = function()
{	try
	{
		stmSensors.Disconnect();
		antSensors.Close();
	} catch(e)
	{
		console.log("Error:", e);
	}
}

exports.End = function()
{
	stmSensors.Destruct();
}
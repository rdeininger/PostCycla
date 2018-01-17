/**
* Ant+ Sensor test
* 	This test will try and get data from an Ant+ stick with connected heart rate and cadence sensors
*   Should return a console ouput with the heart rate and cadence
*	
*	Example:
*		{ HeartRate: 95, Cadence : 80 }
*
*   For further information see folder: "antplus"
*   Will not give an error if one of the sensors is not connected/paired.. it will only return 0
*
* @author Richard Deininger
* @version 1.0
*/

var AntSensors = require('../../antplus/AntSensors.js');

var FgRed = "\x1b[31m";
var FgGreen = "\x1b[32m";
var readData = 10; // times to read data (reading once per second)

var showResults =  function (data)
{    
    if (data.Success)
    {
        console.log(FgGreen);        
    } else 
    {
        console.log(FgRed);
    }
    console.log(data);
    console.log("\x1b[0m");    
};

try
{
// sensor id's for my heartrate and cadence sensor
antSensors = new AntSensors(30250, 59056); 
antSensors.Open();
var i = 0;
var interval = setInterval(function () 
{ 
    console.log(antSensors.Data);
    if (i > readData)
    {
        antSensors.Close();
        clearInterval( interval);
    }
    i++;
}, 1000);

} catch(err)
{
    showResults({Success: false, Data: err});
}
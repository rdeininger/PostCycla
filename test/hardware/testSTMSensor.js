/**
* STM32 sensor test
* 	This test will try and get data from the STM32/Arduino and check the output
*   Should return a console ouput with the data from the module
*	
*	Example:
*		{ "distance" : 0, "speedms" : 0, "servoPos" : 0, "sentChar" : 0 }
*
*   For further information see folder: "stm"
*   
* @author Richard Deininger
* @version 1.0
*/

var os = require('os');
var stm = require('../../stm/newstm.js');
var FgRed = "\x1b[31m";
var FgGreen = "\x1b[32m";
var readData = 10; // times to read data (reading once per second)
var i = 0;
var interval= null;

var getComPort = function()
{
    if (os.platform() == "win32")
    {
        return "COM3"; // change this to your std com port
    } else 
    {
        return "/dev/ttyACM0"; // change this to your std com port
    }
}


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
    var stmSensors = new stm(getComPort());    
        
    stmSensors.on("SensorReady", function (data)
    {    
        console.log("Sensor Ready... sending data");    
        setTimeout(function() 
		{
            interval = setInterval(function () 
            { 
                stmSensors.SetLevel((i/10), false);	
                if (i > readData)
                {
                    stmSensors.Disconnect();
                    clearInterval(interval);
                }
                i++;
            }, 1000);
        },3000);  // need to wait at least 2 sec. ?!?!  otherwise it wont work
    });

    stmSensors.on("SensorData", function (data)
    {
        // expected data = { distance: 0.1, speedms: 0, servoPos: 0.1 }
        console.log(data);   
      
    });
    
    stmSensors.Connect();    

} catch(err)
{
    showResults({Success: false, Data: err});
}



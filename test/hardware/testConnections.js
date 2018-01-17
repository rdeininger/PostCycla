/**
* Hardware connection test
* 	Tests the Serial, USB and Ant+ hardware and connection to it
*   Will try to find USB devices and the Ant+ Stick
*   Will also try to connect to the SerialPort (ttyACM0 or COM3)
*   Should return a console ouput containing Testname, Success, and data/info about success or failure
*   (when used on the raspberry success will be green, failure will be red highlighted)
*
* @author Richard Deininger
* @version 1.0
*/


var os = require('os');
var serialtest = require('./libs/test_serial.js');
var usbtest = require('./libs/test_usb.js');
var antplustest = require('./libs/test_antplus.js');
var FgRed = "\x1b[31m";
var FgGreen = "\x1b[32m";

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

// Setup Serial Port
var serial = new serialtest();
serial.Setup({port: getComPort(), baudrate:9600});
serial.on("TestResult",showResults);
// Setup  USB Port
var usb = new usbtest();
usb.Setup();
usb.on("TestResult",showResults);
// Setup ant plus stick
var antplus = new antplustest();
antplus.Setup();
antplus.on("TestResult",showResults);


// Testing everything
serial.Test();
usb.Test();
antplus.Test();

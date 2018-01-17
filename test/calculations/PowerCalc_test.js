/**
* Power calculation Test
* 	Tests the Power calculation with a fixed speed and changing slope
*   Should provide a console output of the used speed, slope and calculated power data
*
* @author Richard Deininger
* @version 1.0
*/
var PowerCalculator = require('../../power/PowerCalcPostCycla.js');

var PowerCalc = new PowerCalculator(90, 10);

var testValues = function(speed, slope)
{
    PowerCalc.CalcPowerData(speed, slope);
    console.log("Speed: %s, Slope: %s, Power: ", speed, slope, PowerCalc.PowerData); 
}

var speed = 10;
var slope = -1;
var weightKG = 100;

testValues(speed, slope++);
testValues(speed, slope++);
testValues(speed, slope++);
testValues(speed, slope++);
testValues(speed, slope++);
testValues(speed, slope++);

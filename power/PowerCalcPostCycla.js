/**
* Power Calculator for PostCycla equipment
*	uses speed, slope, weight,.... to calculate the power/resistance needed to perform
*
*	Calculates:
*		Watts from speed, slope and weight in kg
*		
*		Resistance level from Watts and speed
*			resistance shall be in percentage from max resistance of the equipment 
*			Values: 0.0 - 1.0
*		
*		Raw_Resistance
*			resistance in percentage from maxResistance of equipment 
*			(was implemented because maximum resistance may be exceeded)
*
*	Every fitness equipment needs to implement it's own Resistance level calculations
* 	
*	Will create a power data object:
*		RealWatts		=> the watts we are able to produce with the trainer (may be to small)
*       VirtualWatts	=> the watts needed to perform (may exceed the resistance the trainer can provide)
*       Resistance		=> the resistance for the trainer in percent (0..100%) this will be sent to the trainer
*		Raw_Resistance	=> the resistance needed to perform in percent (0..xxx% may be more then we can provide)
*
* @author Richard Deininger
* @version 1.0
*/

var Settings = require('../settings.js');
var calc = require('../util/calc.js');
var WattsCalc = require('./WattCalculator.js');

// 160 Watts are needed when driving a -1% hill with 10 m/s
// calculated via https://www.gribble.org/cycling/power_v_speed.html
var MinimumJoulperMeter = 16; 

/**
 * PowerCalcPostCycla
 *  Uses the WattCalculator and a minimum setting to calculate power/resistance needed
 */
var PowerCalcPostCycla = function()
{
	this.Watts = new WattsCalc();
	this.PowerData = 
    {
		RealWatts: 0,
        VirtualWatts : 0,
        Resistance : 0,
		Raw_Resistance :0
    };    
}

/**
 * PowerCalcPostCycla
 *  Uses the WattCalculator and a minimum setting to calculate power/resistance needed
 */
PowerCalcPostCycla.prototype.CalcPowerData = function(ms, slope)
{
    this.CalcWatts(ms, slope);
    this.CalcResistenceLevel(this.PowerData.VirtualWatts,ms);
    return this.PowerData;
};


PowerCalcPostCycla.prototype.CalcResistenceLevel = function(watt, ms)
{
	kmh = ms * 3.6
		
	// This formula derived from the resistance measuring for a TACX CYCLETRAINER T1810 
	// see: http://www.fahrrad.de/fahrradzubehoer/rollentrainer-tacx-elite/tacx-cycletrainer-speedmatic-t1810/7146.html
	// THIS NEEDS TO BE CALCULATED FOR EVERY TRAINER
	var level = (((watt)-(0.05569*kmh+1.223)*kmh)/(1.3811*kmh-5.0809));

	// multiply by 0,14285714285714285714285714285714 
	// since first calculations where done by tacx resistance (0-7) and we now want 0..100%
	this.PowerData.Raw_Resistance = calc.ceil(level* Settings.Data.PowerCalc.PowerOffset* 0.14285714285714285714285714285714, 2) ;

	// cutoff "overshot"
	if (level < 1)
	{
		level = 1;
	} else if (level > 7)
	{
		level = 7;
	}

	this.PowerData.Resistance = this.PowerData.Raw_Resistance;
	// since the formula used can produce values of more/less then 0% - 100% we "cut off" wrong values.  
	if (this.PowerData.Resistance > 1)
	{
		this.PowerData.Resistance = 1;
		this.PowerData.RealWatts = calc.floor((1.3811*kmh-5.0809)*level + (0.05569*kmh+1.2233)*kmh, 0);				
	} else if (this.PowerData.Resistance < 0)
	{
		this.PowerData.Resistance = 0;
		this.PowerData.RealWatts = calc.floor((1.3811*kmh-5.0809)*level + (0.05569*kmh+1.2233)*kmh, 0);
	} 

};

// Convert Speed and slope to Power :
// Calculations used from: https://www.gribble.org/cycling/power_v_speed.html
PowerCalcPostCycla.prototype.CalcWatts = function(ms, slope)
{	
	this.PowerData.VirtualWatts = calc.ceil(this.Watts.CalcPower(ms, slope),0);	
	this.PowerData.RealWatts = this.PowerData.VirtualWatts;
};


// export the class
module.exports = PowerCalcPostCycla;

/*
 * Cycling power vs. velocity, based on a physical model.
 *
 * Copyright 2012 by Steven Gribble (gribble [at] gmail (dot) com)
 * http://www.gribble.org/
 * 
 * Many thanks again for allowing me to use your code!
 */
var Settings = require('../settings.js');

var WattCalculator = function()
{
    this.Params = {
        WeightRider : 75,           // weight of rider (kg)
        WeightEquipment : 8,        // weight of bike (kg)
        FrontArea : 0.55,           // frontal area, rider+bike (m^2) (original 0,509)
        DragCoeff : 0.7,            // drag coefficient Cd (original 0,63)
        DriveDrainLoss : 4,         // drivetrain loss Loss_dt (original 3%)
        RollingResistance : 0.005,  // coefficient of rolling resistance Crr
        AirDensity : 1.226,         // air density (kg / m^3)
        Slope : 0,                  // grade of hill (%)        
        Speed : 0                   // speed in km/h
    }; 
}


/**
 * CalcPower
 *  uses the speed, slope and formula from Steve Gribble to calculate the power output needed at the wheels
 */
WattCalculator.prototype.CalcPower = function(speed, slope)
{
    this.Params.WeightRider = Settings.Data.PowerCalc.RiderWeightKG;
    this.Params.WeightEquipment = Settings.Data.PowerCalc.BikeWeightKG;
    this.Params.FrontArea = Settings.Data.PowerCalc.FrontArea;
    this.Params.DragCoeff = Settings.Data.PowerCalc.DragCoeff;
    this.Params.DriveDrainLoss = Settings.Data.PowerCalc.DriveDrainLoss;
    this.Params.RollingResistance = Settings.Data.PowerCalc.RollingResistance;    
    this.Params.Slope = slope;
    this.Params.Speed = speed;
    
    return CalculatePower(this.Params).Wheel;
}
// Calculates and returns the force components needed to achieve the
// given velocity.  <params> is a dictionary containing the rider and
// environmental parameters, as returned by ScrapeParameters(), i.e.,
// all in metric units.  'velocity' is in km/h.
function CalculateForces(params) 
{
    // calculate Fgravity
    var Fgravity = 9.8067 *
        (params.WeightRider + params.WeightEquipment) *
        Math.sin(Math.atan(params.Slope / 100.0));

    // calculate Frolling
    var Frolling = 9.8067 *
        (params.WeightRider + params.WeightEquipment) *
        Math.cos(Math.atan(params.Slope / 100.0)) *
        (params.RollingResistance);

    // calculate Fdrag
    var Fdrag = 0.5 *
        (params.FrontArea) *
        (params.DragCoeff) *
        (params.AirDensity) *
        //(params.Speed) *// * 1000.0 / 3600.0) // check if speed squared is needed (air drag)!!!
        (params.Speed);// * 1000.0 / 3600.0);

    // cons up and return the force components
    var ret = { };
    ret.Fgravity = Fgravity;
    ret.Frolling = Frolling;
    ret.Fdrag = Fdrag;    
    return ret;
}

// Calculates and returns the power needed to achieve the given
// velocity.  <params> is a dictionary containing the rider and
// environmenetal parameters, as returned by ScrapeParameters(), i.e.,
// all in metric units.  'velocity' is in km/h.  Returns power in
// watts.
function CalculatePower(params) 
{
    // calculate the forces on the rider.
    var forces = CalculateForces(params);
    var totalforce = forces.Fgravity + forces.Frolling + forces.Fdrag;

    // calculate necessary wheelpower
    var wheelpower = totalforce * params.Speed;// * 1000.0 / 3600.0);

    // calculate necessary legpower
    var legpower = wheelpower / (1.0 - (params.DriveDrainLoss/100.0));

    return { Leg: legpower, Wheel: wheelpower};
}

module.exports = WattCalculator;
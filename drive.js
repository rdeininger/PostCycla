/**
* Drive module
* 	Reads and writes GPX data
*   Loads the GPX file and uses sensor data to calculate 
*		- Position
*		- Power/Resistance
*		- Data for UI & file output
*
* @author Richard Deininger
* @version 1.0
*/
// --- required modules
var fs = require('fs');
var path = require('path');
var parseString = require('xml2js').parseString;
var calc = require('./util/calc.js');
var sensors = require('./sensors.js');
var gpxWriter = require('./gpx/GPXWriter.js');
var gpxParser = require('./gpx/parseGPX.js');
var latlon = require('./gps/latlon.js');
var Settings = require('./settings.js');
var PowerCalculator = require('./power/PowerCalcPostCycla.js'); // Implement equipment calculations here
var States = require("./serviceState.js");


// --- Fields
var sensorTimer;
var PowerCalc;
var Data = 
{
	elediv: 0,
	recordCnt: 0,
 	segments: new Array(),
	odo : 0,
	lastSegIdx : 0,
	lastWrittenSeg : 0,
	writeDir: "",
}
var PosData = 
{ 
	pos:
		{
			lat: 0, 
			lng: 0, 
			slope: 0,
			ele: 0
		},
	total: 0,
	power : 
	{
		watt: 0,
		resPerc: 0,
		resistance: 0
	},
	odo: 0,
	starttime: 0,
	time: 0,
	bike: 
		{
			speed: 0,
			cad: 0,
			pulse: 0
		}
};

// --- exports

exports.State

var PosUpdateCallback = null;
/**
 * Initialization
 *  Starts PowerCalculator & sets output directory form the saved settings
 */
exports.Init = function()
{
	PowerCalc = new PowerCalculator();
	Data.writeDir = Settings.Data.GPXDir;
}

exports.SetPosUpdateCallback = function(callback)
{
	PosUpdateCallback = callback;
}

/**
 * readGPX
 *  parses the gpx file content and starts sensors for ride
 */
exports.readGPX = function (fileContent) 
{
	Data.odo  = 0;
	Data.lastSegIdx = 0;
	Data.lastWrittenSeg = 0;	

	parseString(fileContent, function (err, result) 
	{
		Data.segments = gpxParser.parse(result.gpx.trk[0].trkseg[0].trkpt);

		States.SetCurrentState(States.States.TrackLoaded);
		States.SetCurrentState(States.States.StartingSensors);
		
		sensors.SetSensorDataCallback(sensorReader);
		sensors.Start(function()
		{	
			States.SetCurrentState(States.States.ReadyForRide);			
		});	
	});		

	
	
}

/**
 * GetPositionData
 *  returns the current position and all data for it
 */
exports.GetPositionData = function()
{
	return PosData;
}

/**
 * StartRide
 *  sets the state accordingly
 *  creates a new gpx file
 * 	sets start time
 *  creates a timer to update ride calculations every second
 */
exports.StartRide = function()
{
	States.SetCurrentState(States.States.RecordingTrack);
	gpxWriter.NewFile(Data.writeDir);
	PosData.starttime = (new Date()).getTime();
	sensorTimer = setInterval(function ()
	{
		rideinterval();
	}, 1000);	
	return "OK";
}

/**
 * StopRide
 *  stops all sensors
 *  closes gpx file
 *  stops ride calculation timer
 *  updates state
 */
exports.StopRide = function(callback)
{
	sensors.Stop();
	gpxWriter.EndFile();
	clearInterval(sensorTimer);	
	States.SetCurrentState(States.States.RideStopped);
	return "OK";
}

/**
 * CancelRide
 *  simply stops sensors and sets state
 */
exports.CancelRide = function()
{
	sensors.Stop();
	States.SetCurrentState(States.States.Ready);
	return "OK";
}

// updates the gpx file with new position data
var sensorReader = function(data)
{
	checkSensors(data);
	Data.recordCnt = ((Data.recordCnt + 1) % 2);
	if ((PosData.bike.speed > 0) && (Data.recordCnt == 1))
	{		
		gpxWriter.AddTrackPoint(PosData);
	} 
	
	// if we "overshoot" end the gpx file and ride
	if (Data.lastSegIdx > Data.segments.length)
	{
		StopRide();
	}
}

// updates the resistance during ride
// everytime the resistance is changed we also will get sensor data... see: sensors.js
var rideinterval = function()
{
	sensors.SetServoPos(PosData.power.resistance);
}



// --- Postion Ride and Sensor Calculations ---------------
var calcNewPoint = function(dist, lat1, lng1, lat2, lng2)
{
	var pos1 = latlon(lat1, lng1);
	var pos2 = latlon(lat2, lng2);
	var bearing = pos1.bearingTo(pos2);
	var newPos = pos1.destinationPoint(dist, bearing);
	return { lat: newPos.lat, lng: newPos.lon }
}

var RecalcPos = function()
{
	var seg = getSegment();	
	if (seg.distDriven > seg.dist)
	{
		PosData.pos.lat = seg.end.lat
		PosData.pos.lng = seg.end.lng;
	}
	{
		var newPos = calcNewPoint(seg.distDriven, seg.start.lat, seg.start.lng, seg.end.lat, seg.end.lng)
		PosData.pos.lat = newPos.lat;
		PosData.pos.lng = newPos.lng;  
	}
	if (PosUpdateCallback)
	{
		PosUpdateCallback(PosData);
	}
}

// uses sensor data to calculate new position and resistance
var checkSensors = function(sensorData)
{
	PosData.bike.speed = calc.floor(sensorData.mps * 3.6, 2); // convert mps to kph
	PosData.bike.pulse = sensorData.hr;
	PosData.bike.cad = Math.floor(sensorData.cad);
	var DistDriven = sensorData.dist;
	
	var segment = getSegment(); // gets the current track segment we are in (inbetween two trackpoints)
	if (segment)
	{	
		// update current time/data (for gpx file)
		PosData.time = new Date(); 
		PosData.pos.ele = segment.ele;
		PosData.pos.lat = segment.lat;
		PosData.pos.lng = segment.lng;
		PosData.pos.slope = segment.slope;
		
		// calculates watts and resistance from speed slope and weight
		PowerCalc.CalcPowerData(sensorData.mps, PosData.pos.slope);
		// these are the watts we are able to generate with the trainer /  the Watts we need to perform
		PosData.power.watt = PowerCalc.PowerData.RealWatts+"/" +PowerCalc.PowerData.VirtualWatts; 
		
		// We only slowly in/decrease resistance (like in reality)
		var res = PowerCalc.PowerData.Resistance - PosData.power.resistance;
		if (Math.abs(res) > 0.1) 
		{
			res = 0.1 *(Math.abs(res)/res);
		}

		// if the "virtual"/needed watts are more then we are currently able to produce via the trainer we cut it from the distance
		if (PowerCalc.PowerData.RealWatts < PowerCalc.PowerData.VirtualWatts)		
		{
			DistDriven = (DistDriven / PowerCalc.PowerData.VirtualWatts) * PowerCalc.PowerData.RealWatts;
		}
		segment.distDriven += DistDriven // we add the driven distance to the current segment data

		// setting the "virtual data"
		PosData.power.resistance +=res;		
		PosData.power.resPerc = calc.floor(PosData.power.resistance * 100, 0);				
		PosData.bike.virtualSpeed = calc.ceil(DistDriven * 3.6, 2);
		
		// storing currently overall performance
		PosData.LastDist = DistDriven;
		Data.odo += DistDriven;
		PosData.total = calc.floor(Data.segments.Odo/1000, 2);
		PosData.odo = calc.floor(Data.odo/1000, 3);
		// calculating current elevation from startpoint slope and driven distance
		// (as we are between two trackpoints)
		PosData.pos.ele = calc.floor(PosData.pos.ele + (PosData.pos.slope * (segment.end.ODO - Data.odo)/-10),1);
		// same here for new trackpoints
		RecalcPos(segment);
	}

};

// will search for the current segment (between two track points) we are in
// needed to calculate resistance
var getSegment = function()
{
	if (Data.lastSegIdx < Data.segments.length) // check if we drove over the last segment
	{
		var tmpIdx = Data.lastSegIdx;
		var seg = Data.segments[tmpIdx];
		// search for the new segment by checking if we allready drove the distance needed to successfully finish this segment
		while (tmpIdx < Data.segments.length &&  seg.distDriven >= seg.dist)
		{			
			tmpIdx++;			
			if (tmpIdx < Data.segments.length)
			{
				// if we finished the semgent we use the "leftover" distance to use for the new segment
				var diff = seg.distDriven - seg.dist;
				seg = Data.segments[tmpIdx];
				seg.distDriven = diff;
			}
		}
		// simple check if the new found segment is the last
		if (tmpIdx >= 0)
		{
			Data.lastSegIdx = tmpIdx;
			if (Data.lastSegIdx > Data.segments.length)
			{
				Data.lastSegIdx = Data.segments.length -1;
			}
		}
	}
	return Data.segments[Data.lastSegIdx];
}


// --- Mountain SVG Data ------

exports.GetMountain = function()
{
	return SvgMountain();
}


// we create a profile of the elevation we are about to drive
var SvgMountain = function()
{	
	var path = "";
	var size = { width: 1200, height: 150 }
	var xratio = Math.ceil(Data.segments.Odo /size.width);
	var height = Math.ceil(Data.segments.MaxEle-Data.segments.MinEle);
	var yratio = Math.ceil(height / size.height);
	var lastx = 0;
	var yZero = height / yratio;
	for (var i = 0; i < Data.segments.length; i++)
	{
		var seg = Data.segments[i];	
		var newx = Math.floor(seg.end.ODO / xratio);	
		if (newx > lastx)
		{
			lastx = newx;				
			path += " L "+newx+" "+calc.ceil((Data.segments.MaxEle - seg.ele) /yratio, 2);
		}		
	}
	var tmp = '<svg id="MountainSVG" internalwidth='+size.width+' width="'+size.width+'" viewBox="0 0 '+size.width+' '+size.height+'" xmlns="http://www.w3.org/2000/svg" version="1.1">';	
	tmp += '<path d="M 0 '+yZero;
	tmp += path+'L '+size.width+' '+yZero+'" fill="gray" />';
	tmp += '<rect id="svgBikePos" x="0" y="0" width="0.1" height="'+yZero+'" stroke="red" stroke-width="0.5"/>'
	tmp +='</svg>';
	return tmp;
}


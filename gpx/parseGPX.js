
/**
* Parse GPX
*	will get the gpx file content parse the xml and smooth out the track
*	
*	Trackpoints (longitude, lattitude) will be read and divided into segments.
*	Outputdata:
*		Segments:
*			Array with "segment items"
*			MinEle	=> lowest elevation found in the gpx file (needed for mountain profile)
*			MaxEle 	=> highest elevation found in the gpx file (needed for mountain profile)
*			Odo 	=> overall length of the track (needed for user and mountain profile)
*
*		Segment item:
*			start: 	{lat, lng} => trackpoint where the segment starts
			end: 	{lat, lng} => trackpoint where the segment ends
				--- both are needed to calculate the "heading" to calculate an intermediat gps point 
				--- (where we are now,... to wirte back into the new gpx file)	
			dist		=> distance btween start and end (in meter)
			distDriven  => distance already driven (in meter) 
			eleDelta	=> elevation difference between start and end (in meter)
			ele			=> elevation at the startpoint (in meter)
			slope		=> elevation slope between start and end (in %)
*
* @author Richard Deininger
* @version 1.0
*/
var Settings = require('../settings.js');
var calc = require('../util/calc.js');
var latlon = require('../gps/latlon.js');
var simple = require('./simplifyPosData.js');

/**
 * parse
 *  smooths out the  track and segments the single points 
 *  will also calcuste overall distance, lowest and highes elevation
 */
exports.parse = function (trkPoints) 
{
    var segments =  new Array();
	
    if (trkPoints)
	{
		var last = 0;
		var next = last +1;		
		var odo = 0;
		var minele = 10000; // hopefully will never find a higher mountain (definitly not biking up the Everest)
		var maxele = 0;	

		if (Settings.Data.Smooth > 0)
		{
			trkPoints = SmoothTrack(trkPoints);
		}
		while (trkPoints.length > next)
		{
			// take last/current and next track point to generate segment
			var seg = calcSegment(trkPoints[last], trkPoints[next]);
			
			//only use segments with distance...
			if (seg.dist > 0) // sum up/ check overall distance, low-high point
			{				
				seg.start.ODO = odo;
				odo = calc.ceil(odo + seg.dist);

				seg.end.ODO = odo;
				segments.push(seg);			
				if (seg.ele > maxele)
				{
					maxele = seg.ele ;				
				}
				if (seg.ele < minele)
				{
					minele =seg.ele;
				}
			}			
			
			last = next;
			next = last +1;					
		}
		segments.MinEle = minele;
		segments.MaxEle = maxele;
		segments.Odo = odo;		
	}
    return segments;
}

/**
 * SmoothTrack
 *  use simplify script to smooth out "bumpy tracks" (elevaltion will not be "touched")
 *	also we may not need waypoints only 5 or fewer meters apart
 */
var SmoothTrack = function(trkPoints)
{
	var last = 0;
	var next = last +1;		
	trkPoints[0].x = 0;
	trkPoints[0].y = parseFloat(trkPoints[0].ele[0]);
	odo = 0;
	while (trkPoints.length > next)
	{
		var dist = getDistance(trkPoints[last], trkPoints[next]);
		odo = calc.ceil(odo + dist);				
		trkPoints[next].x = odo;
		trkPoints[next].y = parseFloat(trkPoints[next].ele[0]);
		last = next;
		next = last +1;		
	}		
	return simple.simplify(trkPoints, Settings.Data.Smooth);
}

// distance between two geo points
var getDistance = function(trkPnt1, trkPnt2)
{
	var pos1 = latlon(trkPnt1['$'].lat, trkPnt1['$'].lon);
	var pos2 = latlon(trkPnt2['$'].lat, trkPnt2['$'].lon);
	return pos1.distanceTo(pos2);	
}

// creates a new segment from the two track points provided
var calcSegment = function(trkPnt1, trkPnt2)
{
	var elevation = (parseFloat(trkPnt2.ele[0])- parseFloat(trkPnt1.ele[0]));
	var m = getDistance(trkPnt1, trkPnt2);

	var sl = ((100 * elevation)/Math.pow(Math.pow(m,2) - Math.pow(elevation, 2), 0.5));

	var tmp = { 		
		start: {
			lat: 	parseFloat(trkPnt1['$'].lat),
			lng: 	parseFloat(trkPnt1['$'].lon)
		},
		end: {
			lat: 	parseFloat(trkPnt2['$'].lat),
			lng: 	parseFloat(trkPnt2['$'].lon)
		},
		dist:	calc.ceil(m),		
		distDriven: 0,
		eleDelta:	calc.ceil(elevation),
		ele:  	calc.ceil(parseFloat(trkPnt2.ele[0])),
		slope:	calc.ceil(sl),

	};

	return tmp;
}

/**
* GPXWriter
* 	Records the current progress on the virtual track
*	
*   
* @author Richard Deininger
* @version 1.0
*/

var files = require('./files.js');

var Data = 
{
	file: ""
}

// converts datetime to meta data/XML time for gpx file
var toXMTime = function(datetime)
{
    return datetime.toISOString();
}

// gpx track point need the position data from the drive.js to create a new gpx track point
var trackPoint = function(data)
{
    return '<trkpt lat="'+data.pos.lat+'" lon="'+data.pos.lng+'">'+
                '<ele>'+data.pos.ele+'</ele>'+
                '<time>'+toXMTime(data.time)+'</time>'+
                '<extensions>'+
                    '<gpxtpx:TrackPointExtension>'+
                        '<gpxtpx:hr>'+data.bike.pulse+'</gpxtpx:hr>'+
                        '<gpxtpx:cad>'+data.bike.cad+'</gpxtpx:cad>'+
                    '</gpxtpx:TrackPointExtension>'+
                '</extensions>'+
            '</trkpt>';
}

// gpx file header needs the time to add in metadata and name
var trackHeader = function(realtime, datestr)
{
	
	return '<?xml version="1.0" encoding="UTF-8"?>'
	+'<gpx creator="PostCycla" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 ' +'http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd ' +'http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 ' +'http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd ' +'http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 '+'http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd ' +'http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3"> '
 	+'<metadata><time>'+realtime+'</time></metadata><trk>'
	+'<name>PostCycla Training '+datestr+'</name><trkseg>';
}

// gpx file footer
var trackFooter = function()
{
	return '</trkseg></trk></gpx>';
}

/**
 * NewFile
 *  Creates a new file with current date/time ans name and adds header data
 */
exports.NewFile = function(dir)
{
	var now = new Date();
	var datestr = now.getFullYear().toString()+now.getMonth().toString()+now.getDate().toString()+"_"+now.getHours().toString()+"-"+now.getMinutes().toString();

	Data.file = dir+"/PostCycla"+datestr+".gpx";
	files.AppendFile(Data.file, trackHeader(toXMTime(new Date()), datestr));
}

/**
 * AddTrackPoint
 *  Appends the file by one new point on the track with current data
 */
exports.AddTrackPoint = function(PosData)
{
	files.AppendFile(Data.file,trackPoint(PosData));
}

/**
 * EndFile
 *  Appends the file footer to the gpx
 */
exports.EndFile = function()
{
	files.AppendFile(Data.file, trackFooter());
	Data.file = null;
}
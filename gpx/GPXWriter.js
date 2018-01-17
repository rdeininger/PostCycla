var files = require('../files.js');

var Data = 
{
	file: ""
}
var toXMTime = function(datetime)
{
    return datetime.toISOString();
}

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

var trackHeader = function(realtime, datestr)
{
	
	return '<?xml version="1.0" encoding="UTF-8"?>'
	+'<gpx creator="PostCycla" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 ' +'http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd ' +'http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 ' +'http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd ' +'http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 '+'http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd ' +'http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3"> '
 	+'<metadata><time>'+realtime+'</time></metadata><trk>'
	+'<name>PostCycla Training '+datestr+'</name><trkseg>';
}


var trackFooter = function()
{
	return '</trkseg></trk></gpx>';
}

var lpad = function(n, width, z) 
{
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

exports.NewFile = function(dir)
{
	var now = new Date();
	var datestr = lpad(now.getFullYear(),4)+lpad(now.getMonth()+1,2)+lpad(now.getDate(),2)+"_"+lpad(now.getHours(),2)+"-"+lpad(now.getMinutes(), 2);

	Data.file = dir+"/PostCycla"+datestr+".gpx";
	files.AppendFile(Data.file, trackHeader(toXMTime(new Date()), datestr));
}

exports.AddTrackPoint = function(PosData)
{

		files.AppendFile(Data.file,trackPoint(PosData));
}

exports.EndFile = function()
{
	files.AppendFile(Data.file, trackFooter());
	Data.file = null;
}
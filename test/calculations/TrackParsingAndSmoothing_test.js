/**
* GPX track parsing and smoothing
* 	Tests the gpx file parser and smoothing algorithm
*   Needs the original example/testing track gpx file (track segment length is fixed for testing)
*   Should result in a console output either showing an error or the new smoothed segments
*
* @author Richard Deininger
* @version 1.0
*/

var Settings = require('../../settings.js');
var parseString = require('xml2js').parseString;
var gpxParser = require('../../gpx/parseGPX.js');
var files = require('../../files.js');


var readGPX = function (fileContent) 
{
    parseString(fileContent, function (err, result) 
    {
        var segments = gpxParser.parse(result.gpx.trk[0].trkseg[0].trkpt);
        if (segments.length >= 1003) // original length of Example/Testing track
        {
            console.log("Error track segments not smoothed.");
            return;
        }
        segments.forEach(function(element) 
        {            
            if (element)
            {                
                console.log(element);             
            } else 
            {
                console.log("Error: ", element);
            }
        }, this); 
    });		
    
}

files.ReadFileContent({ file : "Example_Testing Track.gpx"}, readGPX);
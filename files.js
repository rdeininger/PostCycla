/**
 * Files
 *  Used for reading GPX track files lists and contents
 */

var Settings = require('./settings.js');
var fs = require('fs');
var path = require('path');
var parseString = require('xml2js').parseString;
var States = require("./serviceState.js");

var FileList = null;

exports.GetFileList = function()
{
    return FileList;
}

exports.GetFiles = function(callback)
{
    var me = this;
    fs.readdir(Settings.Data.GPXDir, function(err, files)
    {
       if (err)
       {
           console.log(err);
       }
       // do not load files created by PostCycla itself       
       FileList = files.filter(function(file)
       {            
           return file.indexOf("PostCycla") == -1;
       });
       callback(FileList, err);
    });
}

exports.LoadFileList = function()
{ 
    States.SetCurrentState(States.States.LoadingFileList);
    var me = this;
     fs.readdir(Settings.Data.GPXDir, function(err, files)
     {
        if (err)
        {
            console.log(err);
        }
        // do not load files created by PostCycla itself
        FileList = files.filter(function(file) 
        {            
            return file.indexOf("PostCycla") == -1;
        });
    	States.SetCurrentState(States.States.FileListLoaded);
     });
     return "OK";
}

exports.ReadFileContent = function(requestData, parserCallBack)
{
    if (requestData)
    {
        States.SetCurrentState(States.States.LoadingTrack);
        var file = Settings.Data.GPXDir+'/'+requestData.file;
        fs.readFile(file, 'utf8', function (err,data) 
	    {
            if (err) 
            {
                return console.log(err);
            }
            parserCallBack(data);
        });
    }
    return "OK";
}

exports.AppendFile = function(file, content)
{
    fs.appendFile(file, content, function (err) 
    {
        if (err)
        {
            return console.log(err);
        }        
    });
}
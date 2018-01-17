/**
* PostCycla
* 	Will create a web server/sockets to provide & handle client (html) requests
*   
* @author Richard Deininger
* @version 1.0
*/

var Settings = require('./settings.js'); // this "First"
var app = require('express')();
var http = require('http').Server(app);
var path = require('path');
var drive = require('./drive.js');
var files = require('./files.js');
var States = require("./serviceState.js");
var io = require('socket.io')(http);

drive.Init();

// setting web server path for client files
app.use('/', require('express').static(path.join(__dirname, 'newclient'))); 

//*** WebSocket request handling *//*

States.SetStateCallback(function(state)
{
    io.local.emit("GetState", state);
})

// receiving from client
io.on('connection', function(socket)
{
    
    socket.on('CancelRide', function(data)
	{
        drive.CancelRide();
    });
    socket.on("StartRide", function(data)
    {   
        drive.StartRide();    
    });
    socket.on("StopRide", function(data)
    {   
        drive.StopRide()
    });
    socket.on("GetState", function(data)
    {
        io.local.emit("GetState", States.GetCurrentState());
    });
    socket.on("GetFiles", function()
    {
        files.GetFiles(function(data, err)
        {
            if (err)
            {
                io.local.emit("Error", err);
            } else 
            {
                io.local.emit("GetFiles", data);                    
            }
        });
    });

    socket.on("GetMountain", function()
    {
        io.local.emit("GetMountain", drive.GetMountain());                            
    });

    
    socket.on("LoadTrack",function(data)
    { 
        files.ReadFileContent(data, drive.readGPX); // call file Read and parse callback
    });

    socket.on("GetOptions", function()
    { 
        io.local.emit("GetOptions", Settings.Data);        
    });

    socket.on("SaveOptions", function(req, resp)
    { 
        try
        {
            if (req)
            {
                Settings.Data.BikeWeightKG = req.BikeWeightKG;
                Settings.Data.MinimumJoulperMeter = req.MinimumJoulperMeter;
                Settings.Data.RiderWeightKG = req.RiderWeightKG;
                Settings.Data.Smooth = req.Smooth;
                Settings.Save();
                io.local.emit("SaveOptions", "OK");
            }
        }
        catch(e)
        {
            console.log("Error save Options:",e)
        }
        
    });

    socket.on("GetPowerSettings", function()
    { 
        io.local.emit("GetPowerSettings", Settings.Data.PowerCalc);        
    });

    socket.on("UpdatePowerSettings", function(req, resp)
    { 
        try
        {
            if (req)
            {
                Settings.Data.PowerCalc.FrontArea = req.FrontArea;
                Settings.Data.PowerCalc.DragCoeff = req.DragCoeff;
                Settings.Data.PowerCalc.DriveDrainLoss = req.DriveDrainLoss;
                Settings.Data.PowerCalc.RollingResistance = req.RollingResistance;
                Settings.Data.PowerCalc.PowerOffset = req.PowerOffset;
                Settings.Save();
                io.local.emit("UpdatePowerSettings", "OK");
            }
        }
        catch(e)
        {
            console.log("Error save Options:",e)
        }
        
    });

    if (Settings.Data.DebugOutput)
    {
        console.log('a user connected');
    }
});

drive.SetPosUpdateCallback(function(PosData)
{
    io.local.emit("PosUpdate", PosData);
});

// WebSocket handling */


//*** WebServer request handling (REST) *//*

app.get("/GetState", function(req, resp)
{
    resp.send(States.GetCurrentState());
});

app.get("/LoadFileList", function(req, resp)
{
    resp.send(files.LoadFileList());
});
app.get("/GetFileList",  function(req, resp)
{
    resp.send(files.GetFileList());
});

app.get("/LoadTrack", function(req, resp)
{ 
    resp.send(files.ReadFileContent(req.query, drive.readGPX)); // call file Read and parse callback
});

app.get("/GetOptions", function(req, resp)
{ 
    resp.send(Settings.Data);
});

app.get("/SaveOptions", function(req, resp)
{ 
    if (req.query)
    {
        Settings.Data.BikeWeightKG = req.query.BikeWeightKG;
        Settings.Data.MinimumJoulperMeter = req.query.MinimumJoulperMeter;
        Settings.Data.RiderWeightKG = req.query.RiderWeightKG;
        Settings.Data.Smooth = req.query.Smooth;
        Settings.Save();
    }
    resp.send("OK");
});

app.get("/GetSettings", function(req, resp)
{
    resp.send(Settings.Data);
});
app.get("/CancelRide", function(req, resp)
{
    resp.send(drive.CancelRide());
});
app.get("/StartRide", function(req, resp)
{
    resp.send(drive.StartRide());
});
app.get("/StopRide", function(req, resp)
{
    resp.send(drive.StopRide());
});
app.get("/GetPos", function(req, resp)
{
    resp.send(drive.GetPositionData());
});
app.get("/GetMountain", function(req, resp)
{
    resp.send(drive.GetMountain());
});

// REST handling */

http.listen(Settings.Data.HttpPort);
console.log('Server running at http://localhost:'+Settings.Data.HttpPort+'/');

/**
* ServiceState
* 	Provides and stores the current state of the program to allow multiple connections/restart client
*   
* @author Richard Deininger
* @version 1.0
*/

exports.States = 
{
    Ready:           { Id: 0, Description: "Ready"},
    LoadingFileList: { Id: 1, Description: "Loading file list"},
    FileListLoaded:  { Id: 2, Description: "File list loaded"},
    LoadingTrack:    { Id: 3, Description: "Loading track"},
    TrackLoaded:     { Id: 4, Description: "Track ready"},
    StartingSensors: { Id: 5, Description: "Connecting to Sensors"},
    SensorsReady:    { Id: 6, Description: "Sensors Ready"},
    ReadyForRide:    { Id: 7, Description: "Ready for ride"},
    RecordingTrack:  { Id: 8, Description: "Recording track"},
    RideStopped:     { Id: 9, Description: "Ride Stopped"},
    
}

var CurrentState = this.States.Ready;
var StateCallback = null;
exports.SetStateCallback = function(callback)
{
    StateCallback = callback;
}

exports.SetCurrentState = function(state)
{
    CurrentState = state;
    if (StateCallback)
    {
        StateCallback(CurrentState);
    }
}

exports.GetCurrentState= function()
{
    return CurrentState;
}
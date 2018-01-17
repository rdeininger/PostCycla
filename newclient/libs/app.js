/**
* Main client script
* 	connects via web socket to the PostCycla server
*
* @author Richard Deininger
* @version 1.0
*/


// Main data to keep
var Data = 
{
	webSocket: io.connect(':8125'), // web socket itself	
	mapInit: false,					// checks if the map was already initialized (only needed once)
	map: null,						// map instance
	maplayer: null,					// maplayer instance
	marker: null,					// marker instance (showing us the current position on the map)
	makers: null,					// markerlist
	zoom: 18,						// current map zoom
	loadingDialog: null,			// loadingDialog used when track is loading
	// more map data (might not be needed here anymore)
	fromProjection: null,   
	toProjection: null
	
}



/*** WebSocket functionality */

/**
 * Actions to perform after server reports state back
 * @param data --> contains state description and Id
 */	
function StateActions(data)
{
	$("#State").text(data.Description);
	var stillRecording = false;
	switch (data.Id)
	{
		case 0: // Ready	
		case 1: // Loading file list
		case 2: // File list loaded		
		case 9: // RideStopped
			Send("GetFiles");		
			$("#Ride").hide();
			$("#Options").show();
			$("#CancelRide").hide();	
			$("#StopRide").hide();	
			$("#StartRide").hide();	
			$("#PowerSettings").hide();
			break;
		case 3: // Loading track
		case 4: // Track loaded	
		case 5: // StartingSensors	
		case 6: // SensorsReady
			showLoading("Loading Track");
			$("#Ride").show();	
			$("#TracksList").hide();
			$("#Options").hide();	
			$("#ReConnect").hide();
			$("#PowerSettings").show();
			ReSizeMap();
			break;
		case 8: // RecordingTrack
			hideLoading();	
			$("#CancelRide").hide();	
			$("#StartRide").hide();	
			$("#StopRide").show();			
			$("#Ride").show();	
			$("#TracksList").hide();
			$("#Options").hide();	
			$("#ReConnect").hide();
			$("#PowerSettings").show();
			ReSizeMap();
			LoadMountain();
		break;
		case 7: // ReadyForRide
			hideLoading();
			$("#CancelRide").show();			
			$("#Ride").show();	
			$("#TracksList").hide();
			$("#Options").hide();	
			$("#ReConnect").hide();
			$("#StartRide").show();	
			$("#PowerSettings").show();
			ReSizeMap();
			LoadMountain();
		break;
		default:
			break;
	}
}


Data.webSocket.on("PosUpdate", function (data)
{
	FillRideData(data);	
});

Data.webSocket.on("StartRide", function (data)
{
	$("#CancelRide").hide();
	$("#StartRide").hide();	

});

Data.webSocket.on("GetFiles", function (data)
{
	$("#TracksList").show();
	FillFileList(data);
});

Data.webSocket.on("GetState", function (data)
{
	StateActions(data);
});

Data.webSocket.on("StopRide", function (data)
{
	$("#StopRide").hide();
});

Data.webSocket.on("GetMountain", function (data) 
{
	$('#Mountain').children().remove();	
	$('#Mountain').append(data);	
	$('#MountainSVG').width($( document ).width() - ($("#BikeDiv").width() +50));
});


Data.webSocket.on("GetPowerSettings", function (data)
{
	ShowPowerSettings(data);
});

Data.webSocket.on("UpdatePowerSettings", function (data)
{ 
	if (data == "OK")
	{
		$("#popupPowerSettings").popup("close");
	}
});

Data.webSocket.on("GetOptions", function (data)
{
	ShowOptions(data);
});

Data.webSocket.on("SaveOptions", function (data)
{ 
	if (data == "OK")
	{
		$("#popupOptions").popup("close");
	}
});

function Send(action, data)
{
	Data.webSocket.emit(action, data);
}


/*** User notification */

function hideLoading()
{
	if (Data.loadingDialog)
	{
		Data.loadingDialog.hide();
	}
}

function showLoading(message)
{
	if (Data.loadingDialog)
	{
		Data.loadingDialog.children("h1").text(message);
		Data.loadingDialog.show();
	} else 
	{
		Data.loadingDialog = $.mobile.loading( 'show', 
		{
			text: message,
			textVisible: true,
			html: ""
		});
	}
}	 

/*** Map functionality */

/**
 * Callback after Google Maps init
 * will be called after everything is ready
 */
function initMap()
{
	if (!Data.mapInit)
	{
		Data.fromProjection = new OpenLayers.Projection("EPSG:4326"),   // Transform from WGS 1984
		Data.toProjection   = new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection	

		ReSizeMap();

		Data.map = new OpenLayers.Map("map-canvas",
		{
			eventListeners: {"zoomend": mapEvent },			
			units: 'm',
		});		
		Data.maplayer = new OpenLayers.Layer.OSM("OpenCycleMap");
		Data.map.addLayer(Data.maplayer);		
		Data.markers = new OpenLayers.Layer.Markers( "Markers" );
		Data.map.addLayer(Data.markers);
		var position = new OpenLayers.LonLat(16.709370,48.067949).transform( Data.fromProjection, Data.toProjection);
		
		Data.marker = new OpenLayers.Marker(position);		
		Data.markers.addMarker(Data.marker);		
		Data.map.setCenter (position, Data.zoom);
		
		

		Data.map.updateSize();
		Data.mapInit = true;
	}
}

function mapEvent(event, a,b,c) 
{
	Data.zoom = event.object.zoom;
}

/**
 * Resize map
 *  scale the map to fit the screen
 */
function ReSizeMap()
{
	$('#map-canvas').height($("#DataGrid").height());
	$('#map-canvas').width($( document ).width() - ($("#DataGrid").width() +10));		
}

/**
 * Update Marker
 *  move the marker on the map to show the current position
 */
function UpdateMarker(lat, lng)
{
	Data.map.updateSize();
	var position = new OpenLayers.LonLat(lng,lat).transform( Data.fromProjection, Data.toProjection);	
	Data.map.setCenter (position, Data.zoom);

	newPx = Data.map.getLayerPxFromViewPortPx(Data.map.getPixelFromLonLat(position));
	try
	{
		Data.marker.moveTo(newPx);
	} catch (ex)
	{}	
}

function showMsg(caption, title, detail)
{
	$("#MsgPopup").popup("open");
	$("#MsgCaption").text(caption);
	$("#MsgTitle").text(title);
	$("#MsgDetail").text(detail);	
}


// for resetting
function hideAll()
{
	$("#TracksList").hide();
	$("#Ride").hide();
	$("#CancelRide").hide();	
	$("#StopRide").hide();	
	$("#StartRide").hide();	
	$("#Options").hide();	
	$("#ReConnect").hide();
	$("#PowerSettings").hide();
}

/**
 * Ready
 *  Main startingpoint when loading the client
 */
$(document).ready(function()
{
	// reset all...  start fresh
	hideAll();	
	$("#Close").click(function() { window.close(); });	
	$("#StopRide").click(function(){ Send("StopRide"); });
	$("#StartRide").click(function(){ Send("StartRide"); });
	$("#CancelRide").click(function(){ Send("CancelRide"); });	
	$("#Options").click(function(){ Send("GetOptions"); });		
	$("#OptionsSave").click(SaveOptions);	
	$("#PowerSettings").click(function() { Send("GetPowerSettings"); });
	$("#UpdatePowerSettings").click(UpdatePowerSettings);
	// Check server state and init the map
	Send("GetState", null);
	initMap();
});


// scale everything to fit
$(window).resize(function() 
{
	ReSizeMap();
});


/*** DataMapping  */

/**
 * Fill file list
 *  gets a list of gpx files from the server and shows them to the user to choose one
 */
function FillFileList(data)
{
	// create list and links for html (from data)
	var li = "";
	for(file in data)
	{
		li += "<li><a href='#'>" + data[file] + "</a></li>";
	}
	// just clear listview and add new elements
	$("#fileList").empty();
	$("#fileList").append(li).promise().done(function () 
	{
		//refresh list here 
		$(this).listview("refresh");
		//then add click event using delegation
		$(this).on("click", "li", function () 
		{
			Send("LoadTrack", { file:  $(this).text()});						
		});
	});
}

/**
 * Fill ride data
 *  gets curren data sent from server (containing ride data,... position, speed, heart rate,...)
 *  and fills them into the fields 
 */
function FillRideData(data)
{
	$("#Time").text(getTimeElapsed(data.starttime));
	$("#Elevation").text(data.pos.ele);
	$("#Slope").text(data.pos.slope);
	$("#TrainerSpeed").text(data.bike.speed);
	$("#VirtualSpeed").text(data.bike.virtualSpeed);
	$("#Cad").text(data.bike.cad);
	$("#Pulse").text(data.bike.pulse);	
	$("#Watt").text(data.power.watt);	
	$("#ResPerc").text(data.power.resPerc);
	$("#Dist").text(data.odo);
	$("#Total").text(data.total);
	// moving the little red line in the mountain profile to show the current position
	var svgBikePos = Math.floor( data.odo / (data.total / $('#MountainSVG').attr("internalwidth")));
	
	// spinn the bike wheels (basically just 2 spees)
	$("#svgBikePos").attr('x', svgBikePos );
	// showing the slope of the hill by tilting the bike
	var deg =  data.pos.slope*-1;
	$('#Bike').css('transform', 'rotate('+deg+'deg)' );

	// show the current position of the bike on the map
	UpdateMarker(data.pos.lat, data.pos.lng);
}



function ShowPowerSettings(data)
{
	$("#FrontArea").val(data.FrontArea);
	$("#DragCoeff").val(data.DragCoeff);
	$("#DriveDrainLoss").val(data.DriveDrainLoss);
	$("#RollingResistance").val(data.RollingResistance);
	$("#PowerOffset").val(data.PowerOffset*100);
	$("#popupPowerSettings").popup("open");
}

function UpdatePowerSettings()
{
	var data = 
	{ 	
		FrontArea : parseFloat($("#FrontArea").val()),
		DragCoeff: parseFloat($("#DragCoeff").val()),
		DriveDrainLoss: parseFloat($("#DriveDrainLoss").val()),
		RollingResistance: parseFloat($("#RollingResistance").val()),
		PowerOffset: parseFloat($("#PowerOffset").val() / 100)
	};
	Send("UpdatePowerSettings", data);	
}


function ShowOptions(data)
{
	$("#riderW").val(data.RiderWeightKG);
	$("#bikeW").val(data.BikeWeightKG);
	$("#trackSmooth").val(data.Smooth);
	$("#minJouls").val(data.MinimumJoulperMeter);
	$("#popupOptions").popup("open");
}

function SaveOptions()
{
	var data = 
	{ 	
		RiderWeightKG :$("#riderW").val(),
		BikeWeightKG: $("#bikeW").val(),
		Smooth: $("#trackSmooth").val(),
		MinimumJoulperMeter: $("#minJouls").val()
	};
	Send("SaveOptions", data);	
}

/**
 * Call to the server to get the "Mountain" profile
 */
var LoadMountain = function()
{
	Send("GetMountain", null);
}

/*** Additional functionality */
function getTimeElapsed(startTime)
{
	var diff = (new Date()).getTime() - startTime;

	var msec = diff;
	var hh = Math.floor(msec / 1000 / 60 / 60);
	msec -= hh * 1000 * 60 * 60;
	var mm = Math.floor(msec / 1000 / 60);
	msec -= mm * 1000 * 60;
	var ss = Math.floor(msec / 1000);
	msec -= ss * 1000;
	return lpad(hh,2)+":"+lpad(mm,2)+":"+lpad(ss,2);
}

// just make everything tidy
function lpad(n, width, z) 
{
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

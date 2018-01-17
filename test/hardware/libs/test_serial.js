var SerialPort = require('serialport');
var events = require('events');

const Readline = SerialPort.parsers.Readline;
const parser = new Readline();

var port = null;
var resultData = {
	Test: 'SerialPort', 
	Success: false, 
	Data: null};

var Test = function()
{
	events.EventEmitter.call(this);
    var me = this;
    
	this.Result = function(success, data)
	{				
		resultData.Success = success;
		resultData.Data = data;
		this.emit('TestResult', resultData);	
    }
    
    this.Setup = function(data)
    {
		console.log('Serial setup');  
        try
        {
			port = new SerialPort(data.port, { baudRate: data.baudrate, autoOpen: false });						
			port.pipe(parser);
			parser.on('data', function (data)
			{          
				if (data.trim() != "")
				{
					port.close(function (err) 
					{
						if (err) 
						{
							me.Result(false,err);					
						} else 
						{
							me.Result(true, data);
						}
					});
				}
			});
			port.on('error', function(data)
			{
				me.Result(false, data.toString('ascii'));
			});			
			
        } catch(err) 
        {
            me.Result(false,err);
        }
	}
	
	this.Test = function()
	{
		try
		{
			console.log("sending serial data");			
			port.open(function (err) 
			{				
				if (err) 
				{
					me.Result(false,err);					
				} else 
				{
					setTimeout(function() 
					{
						var send = String.fromCharCode(123)+ '\n';
						port.write(send, 'ascii', function(err)
						{						
							if (err)
							{
								me.Result(false,err);	
							}				
						});	
					}, 3000); // need to wait at least 2 sec. ?!?!  otherwise it wont work
				}
			});				
		} catch(err) 
		{
			me.Result(false,err);
		}
	}
}

Test.prototype.__proto__ = events.EventEmitter.prototype;


// export the class
module.exports = Test;
var usbPort = require('usb');
var events = require('events');

var resultData = {
	Test: 'USBPort', 
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
		console.log('USB setup');  
        try
        {
			
        } catch(err) 
        {
            me.Result(false,err);
        }
	}
	
	this.Test = function()
	{
        try
        {		
            console.log("checking usb devices");
            var list = usbPort.getDeviceList();
            me.Result(true, list);                      	
        } catch(err) 
        {
            me.Result(false,err);
        }
	}
}

Test.prototype.__proto__ = events.EventEmitter.prototype;


// export the class
module.exports = Test;
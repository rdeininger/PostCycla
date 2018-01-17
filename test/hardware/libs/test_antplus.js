var Ant = require('../../../antplus/antplus.js');
var events = require('events');

var resultData = {
	Test: 'AntPlus', 
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
		console.log('AntPlus setup');  
        try
        {
            me.stick = new Ant.GarminStick2();
            me.stick.on('startup', function () 
            {
                console.log('Ant stick started');
                try
                {                  
                    me.stick.detach_all();
                    me.stick.close();                     
                } catch(err) 
                {
                    me.Result(false,err);
                }
                

            });
            me.stick.on('shutdown', function () 
            { 
                me.Result(true, 'Ant Stick started and shut down gracefully!');                 
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
            console.log("checking ant plus stick");
            if (!me.stick.open()) 
	        {
                me.Result(false, 'Stick not Found');                      	
                return;
	        } 
            
            //me.Result(true, 'Everything fine');                      	
        } catch(err) 
        {
            me.Result(false,err);
        }
	}
}

Test.prototype.__proto__ = events.EventEmitter.prototype;


// export the class
module.exports = Test;
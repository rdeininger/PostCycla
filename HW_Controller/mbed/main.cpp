/**
* PostCycla stm32 sensor and server controller
* 	Used to read a CNY 70 reflex sensor to sense rotational speed of the trainers roller
*   and set the servo position (0..100%) to change the resistance 
*   (servo will be mounted to the trainer actuating the trainers bowden cable)
*	Input:
*		any character between 32...132 (0..100%) and newline as delimiter
*
*	Output:
*		(will be triggered every time an input was sent)
*		Will send a JSON string containing:
*		{ "distance" : xxx, "speedms" : xxx, "servoPos" : xxx, "charSent" : xxx }
*
*	distance => dinstance since the last time the sensor was read
*	speedms => 	current speed in meters per second
*	servoPos => current position of the servo setting the trainer resistence
*	sentChar => the servo position can be set from 0...100% and will be sent to the STM as an character followed by a newline
*				this sentChar was implemented for debugging and will show the last sent character (should be between 32 and 132)
*
* @author Richard Deininger
* @version 1.0
*/

#include "mbed.h"
#include "Servo.h"
 
Servo servo(D3);				// servo on pin 3
Serial pc(USBTX, USBRX);		// starting serial port for communication with PostCycla sensor module
DigitalOut  ledOut(LED1);		// previously used for debugging
InterruptIn lightBarrier(D12);	// pin 12 will sence the voltage output of the CNY 70
Timeout distanceTimer;
Timer stopwatch;

float roller_circum = 0.1;  // roller circumference in m
int rotation_Cnt = 0;       // roller rotation counter

int timer_end = 0;          // stopwatch timer end time
int timer_begin = 0;        // stopwatch timer begin time

float distanceTotal = 0;    // distance in m since last request
float speed = 0;            // current speed in m/s
int charSent = 0;

float position = 0.5;       // current servo position
float range = 0.0005;       // current servo range
 
/*
    ligth Barrier counter
    Counts light barrier hits (rotations of roller)
    Writes:
        rotation_Cnt    - adds one
*/
void lightBarriercallback()
{
    rotation_Cnt++;
}

/*
    Send request data
    Send the requested data via serial output and resets total distance
*/
void sendRequestData()
{
    pc.printf("{ \"distance\" : %.1f, \"speedms\" : %0.2f, \"servoPos\" : %.3f, \"charSent\" : %d }\n", distanceTotal, speed, position, charSent);
    
}


/*
    distance timeout
    Gets called every second and calculates distance and speed travelled.
    Reads: 
        stopwatch       - to get accurate time since last call (should be every second)
        rotation_Cnt    - rotations since last call of distance timeout
    Writes:
        distance        - in m from rotation_Cnt and roller_circum
        totalDistance   - in m by addin distance
        speed           - in m/s calculated from stopwatch time and distance
        rotation_Cnt    - resets to 0 after read
        timer_end       - used for accurate timeing
        timer_begin     - used for accurate timeing
    
*/
void distanceTimeoutCallback()
{   
    // gets time passed since last distance update     
    timer_end = stopwatch.read_us();    
    int usPassed = timer_end - timer_begin;
    
    float distance = (roller_circum * rotation_Cnt);   // gets distance in m since last distanceTimer call
    speed = (distance * usPassed) /1000000;          // calcs speed in m/s from passed time and distance
    distanceTotal += distance;                  // adds current distance to total distance
     
//    sendRequestData();
    // resets all for next timeout
    rotation_Cnt = 0;                                   // resets rotationCounter    
    distanceTimer.attach(&distanceTimeoutCallback,1);   // restarts distanceTimer    
    stopwatch.start();                                  // restarts Stopwatch
    timer_begin = stopwatch.read_us();                  // stores last distance update time
}   

/*
    Set Servo
    Sets requested servo postion
*/
void setServo(float pos)
{
    position = pos;
    servo.calibrate(range, 45.0); 
    servo = position;    
}


int main() 
{
    // lightBarrier counter
    lightBarrier.fall(&lightBarriercallback);
    
    // checks Speed and distance ever second
    distanceTimer.attach(&distanceTimeoutCallback,1);
    stopwatch.start();
    timer_begin = stopwatch.read_us();
   
    int tmpChar = 0;
    // checks input via searial for new request
    while(1) 
    {               
        while(tmpChar != 10) // read till newLine
        {        
            tmpChar = pc.getc();
            if (tmpChar >= 32 && tmpChar <= 133) // only get valid chars and only the last one
            {
                charSent = tmpChar;
            }
        }
        tmpChar = 0;
        float newPos = ((float)(charSent - 32)) / 100.0; 
        
        setServo(newPos);
    
        sendRequestData();
        distanceTotal = 0;   //always reset
            
        
    }
}
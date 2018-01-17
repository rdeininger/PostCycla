/**
* Hardware Mockup for the PostCycla stm32 sensor and server controller
*	Input:
*		any character and newline as delimiter 
*   (will only evaluate inputs a-z so we are able to use the keyboard for debugging)
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
* for Debugging will use the a-z input to convert them into 0..10 and use this as an output for distance, speed and servoPos
*
* @author Richard Deininger
* @version 1.0
*/


char lastReceivedChar;

// main setup will just initialize the serial port
void setup() 
{
  Serial.begin(9600);
}

// main loop will read all data from serial and send back an answer
void loop() 
{
  recvOneChar();
}

// checks the serial input for 
void recvOneChar() 
{
  if (Serial.available() > 0) // checks if anything can be read
  {
    char tmp  = Serial.read();     
    if (tmp == '\n') // checks for newline delimiter
    {      
      // convert input to value between 0..10
      float serverPos = (float(lastReceivedChar) - 97)* 0.4;
      if (serverPos > 10)
      {
         serverPos = 10;
      } else if (serverPos < 0)
      {
        serverPos = 0;
      }
      //rturn output
      Serial.print("{ \"distance\" :  ");      
      Serial.print(serverPos);
      Serial.print(", \"speedms\" : ");
      Serial.print(serverPos);
      Serial.print(", \"servoPos\" : ");
      Serial.print(serverPos);
      Serial.print(", \"sentChar\" : ");
      Serial.print(int(lastReceivedChar));
      Serial.println(" }");      
    } else 
    {
      lastReceivedChar = tmp; // if not newline
    }
  }
}

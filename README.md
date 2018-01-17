# PostCycla
Is a DIY project to create a smart bike trainer with "virtal ride" capability, using a Raspberry Pi and Node.js for the server and a Web UI on the client side. A STM32 MCU Nucleo with a CNY 70 sensor and a servo will get data from the trainer and set the resistance.

For testing and development mockup implementations of all sensors and actuators are available at: [Running the tests](#running-the-tests)

To set up sensors and actuators you can use any microcontroller to read/control sensors and a servo.
Every component was encapsulated to allow easy swapping of sensors, controllers or provide another way of sensing distance/speed and setting resistance on the trainer.

Future modules/components will include a way to directly read data and set resistance of Ant+ FE-C capable trainers.


## Getting Started

### On Windows
* Clone the repository
* Install the [Node modules](#installing)
* [Start everything](#how-to-start) 

### On Raspberry
* Set up a Raspberry Pi with NodeJs.
* Clone the repository and copy it to the Raspberry
* Install the [Node modules](#installing)
* [Start everything](#how-to-start) 


## Prerequisites
### Hardware
* Raspberry Pi 3
* STM32 MCU Nucleo/Arduino Nano
* CNY 70
* Servo
* Ant+ USB Stick
* Ant+ heart rate monitor chest strap
* Ant+ candence sensor

(the current implementation uses this hardware setup)

### Software
* NodeJs 4.8.2 (on Raspberry Pi)

Node Modules:
* [usb](https://github.com/tessel/node-usb)
* [serialport](https://www.npmjs.com/package/serialport#module_serialport--SerialPort+event_error)
* [xml2js](https://github.com/isaacs/sax-js/)
* [socket.io](https://socket.io/get-started/chat/)
* [express](http://expressjs.com/de/)

A gpx file for testing/running the software. **The gpx file needs to contain elevation data!**
    
### Installing
**USB**
```
sudo apt-get install build-essential libudev-dev
npm install usb
```
**Serial port**
```
sudo npm install serialport --unsafe-perm --build-from-source
```
**XML Parser**
```
npm install xml2js
```
**Web sockets**
```
npm install --save socket.io
```
**Express**
```
npm install express --save
```
## Running the tests

To test PostCycla itself you can set the "UseMockups" and "DebugOutput" flags in the "settings.json" file and [start the program](#running-the-program).
```
...
	"UseMockups": true,    
	"DebugOutput": false,
...
```
In the "test" folder you will find test for the calculation and hardware components.

For hardware testing you can also use the [hardware mockup code](#arduino-hw-mockup).

**Calculations**

```
node test/calculations/PowerCalc_test.js
```
Tests the power calculation with a fixed speed and changing slope.
* Should provide a console output of the used speed, slope and calculated power data

```
node test/calculations/TrackParsingAndSmoothing_test.js
```
Tests the gpx file parser and smoothing algorithm
* Needs the original example/testing track gpx file (track segment length is fixed for testing)
* Should result in a console output either showing an error or the new smoothed segments

**Hardware**
```
node test/hardware/testConnections.js
```
Tests the Serial, USB and Ant+ hardware and connection to it
* Will try to find USB devices and the Ant+ Stick
* Will also try to connect to the SerialPort (ttyACM0 or COM3)
* Should return a console ouput regarding Testname, Success, and data/info about success or failure

```
node test/hardware/testAntplusSensors.js
```
This test will try and get data from an Ant+ stick with connected heart rate and cadence sensors
*   Should return a console ouput with the heart rate and cadence (if sensors are connected to the Ant+ stick)

```
node test/hardware/testSTMSensor.js
```
This test will try and get data from the STM32/Arduino and check the output
*   Should return a console ouput with the data from the module

For hardware testing you can also use the [hardware mockup code](#arduino-hw-mockup).

## Running the program
### Setup
To set up the hardware use the code in the "HW_Controller" folder.
#### STM32 MCU Nucleo
Contains the code currently used in the project
```
HW_Controller/mbed/main.cpp
```
#### Arduino HW mockup
Contains code for testing the hardware communication modules
```
HW_Controller/PostCyclaHardwareMock/PostCyclaHardwareMock.ino
```
#### Without hardware
Change the "settings.json" file:
```
...
	"UseMockups": true,    
	"DebugOutput": true,
...
```
If these settings are used, you can run PostCycla without any hardware attached and get additional information in the Node.js console.

### How to start
```
sudo node postcycla.js
```
The web UI can be accessed via the address shown in the nodejs output.
Deault:
```
http://localhost:8125/
```
Simply open this address in your web browser to see the client UI.

* For testing an "Example_Testing Track.gpx" was added in the "tracks" folder.
* The new GPX will be generated in the "tracks" folder (will not be available in the UI)

**Note to finish/close the new GPX file you need to "STOP" the ride (even when you reached the end)**

## Built With

* [Node.JS](https://nodejs.org/) - 
* [Visual Studio Code](https://code.visualstudio.com/) - IDE

## Contributing

Everyone is welcome to help, add, improve, ... only one rule here: "Don't be a dick".

## Authors

* **Richad Deininger** - *Initial idea / hardware / code* - [HackaDay project](https://hackaday.io/project/18658-postcycla)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

A big thanks to the following:

* [Steve Gribble](https://www.gribble.org/cycling/power_v_speed.html)  - providing the power calculations
* [Ladimir Agafonkin](mourner.github.io/simplify-js) - and his Simplify.js scripts
* [Movable Type Ltd](http://www.movable-type.co.uk) - for their gps calculation scripts
* [Isaac Z. Schlueter and Contributors](https://github.com/isaacs/sax-js/) - xml parsing for the gpx files
* [OpenLayers Map Viewer Library](https://openlayers.org/) - providing a solid map library
* [Alessandro Vergani](https://github.com/Loghorn/ant-plus) - Ant+ node module
* [Nonolith Labs, LLC](https://github.com/tessel/node-usb) - USB library for Node.JS
* [Christopher Williams](https://github.com/node-serialport/node-serialport) - Node Serialport
* [Socket.io](https://socket.io) - Web sockets
* [Express](http://expressjs.com/de/) - Web server
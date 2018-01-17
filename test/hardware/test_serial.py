#Fallback test for serial communication

import serial #test as serial
import time
import sys

def writeSerial(data):		
	port.write(data)
	port.write("\n")	
	rcv = port.readline()
	#bytesToRead = port.inWaiting()
	#rcv = port.read(bytesToRead)
	print rcv

comport = "/dev/ttyACM0"

port = serial.Serial(comport, baudrate=9600, timeout=3.0)
port.close()
port.open()
sin = raw_input("Pos: ")
while not (sin == "exit"):
	print(sin)
	writeSerial(sin)
	sin = raw_input("Pos: ")
	
port.close()
	

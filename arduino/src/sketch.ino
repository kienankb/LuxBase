#include "RGBdriver.h"

#define CLK 7
#define DIO 6

RGBdriver Driver(CLK, DIO);
String rString = "";
String gString = "";
String bString = "";

void setup() {
	Serial.begin(9600);
	while (!Serial);
	Driver.begin();
	Driver.SetColor(0,0,0);
	Driver.end();
	Serial.println("ok");
}

void loop() {
	while (Serial.available() > 0) {
		if(Serial.read() == '$')
		{
			while (1) {
				int nxtChar = Serial.read();
				if (isDigit(nxtChar)) {
					rString += (char)nxtChar;
				}
				else if (nxtChar == '#') {
					break;
				}
			}
			while (1) {
				int nxtChar = Serial.read();
				if (isDigit(nxtChar)) {
					gString += (char)nxtChar;
				}
				else if (nxtChar == '#') {
					break;
				}
			}
			while (1) {
				int nxtChar = Serial.read();
				if (isDigit(nxtChar)) {
					bString += (char)nxtChar;
				}
				else if (nxtChar == '#') {
					break;
				}
			}
			int r = rString.toInt();
			int g = gString.toInt();
			int b = bString.toInt();
			if (r < 0) {r = 0;} else if (r > 255) {r = 255;}
			if (g < 0) {g = 0;} else if (g > 255) {g = 255;}
			if (b < 0) {b = 0;} else if (b > 255) {b = 255;}
			Driver.begin();
			Driver.SetColor( gString.toInt(), bString.toInt(), rString.toInt() );
			Driver.end();
			rString = gString = bString = "";
		}
		else {
			while (Serial.peek() != '$') { Serial.read(); }
		}
	}
}

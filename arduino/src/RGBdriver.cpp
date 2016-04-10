//  This library is free software; you can redistribute it and/or
//  modify it under the terms of the GNU Lesser General Public
//  License as published by the Free Software Foundation; either
//  version 2.1 of the License, or (at your option) any later version.
//
//  This library is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//  Lesser General Public License for more details.
//
//  You should have received a copy of the GNU Lesser General Public
//  License along with this library; if not, write to the Free Software
//  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
//  Modified Record:
/***************************************************************************/
#include "RGBdriver.h"
RGBdriver::RGBdriver(uint8_t Clk, uint8_t Data)
{
  Clkpin = Clk;
  Datapin = Data;
  pinMode(Datapin, OUTPUT);
  pinMode(Clkpin, OUTPUT);
}

void RGBdriver::begin(void)
{
  Send32Zero();
}

void RGBdriver::end(void)
{
  Send32Zero();
}

void RGBdriver::ClkRise(void)
{
  digitalWrite(Clkpin, LOW);
  delayMicroseconds(20);
  digitalWrite(Clkpin, HIGH);
  delayMicroseconds(20);
}

void RGBdriver::Send32Zero(void)
{
  unsigned char i;
  for (i=0; i<32; i++)
  {
    digitalWrite(Datapin, LOW);
    ClkRise();
  }
}

uint8_t RGBdriver::TakeAntiCode(uint8_t dat)
{
  uint8_t tmp = 0;
  if ((dat & 0x80) == 0) { tmp |= 0x02; }
  if ((dat & 0x40) == 0) { tmp |= 0x01; }
  return tmp;
}

// gray data
void RGBdriver::DatSend(uint32_t dx)
{
  uint8_t i;
  for (i=0; i<32; i++)
  {
    if ((dx & 0x80000000) != 0) { digitalWrite(Datapin, HIGH); }
    else { digitalWrite(Datapin, LOW); }
    dx <<= 1;
    ClkRise();
  }
}

// Set color
void RGBdriver::SetColor(uint8_t Red,uint8_t Green,uint8_t Blue)
{
  uint32_t dx = 0;
  dx |= (uint32_t)0x03 << 30;             // highest two bits 1，flag bits
  dx |= (uint32_t)TakeAntiCode(Blue) << 28;
  dx |= (uint32_t)TakeAntiCode(Green) << 26;
  dx |= (uint32_t)TakeAntiCode(Red) << 24;
  dx |= (uint32_t)Blue << 16;
  dx |= (uint32_t)Green << 8;
  dx |= Red;
  DatSend(dx);
}

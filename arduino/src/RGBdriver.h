#ifndef RGB_DRIVER_H
#define RGB_DRIVER_H
#include <inttypes.h>
#include <Arduino.h>
class RGBdriver
{
  public:
    RGBdriver(uint8_t, uint8_t);
    void begin(void);
    void end(void);
    void ClkRise(void);
    void Send32Zero(void);
    uint8_t TakeAntiCode(uint8_t dat);
    void DatSend(uint32_t dx);
    void SetColor(uint8_t Red,uint8_t Green,uint8_t Blue);
  private:
    uint8_t Clkpin;
    uint8_t Datapin;
};
#endif

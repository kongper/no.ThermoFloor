'use strict';

module.exports = {
  'Z-TEMP2': {
    locked: null,
    thermostat_mode_single: null,
    target_temperature: null,
    thermostat_state: null,
    measure_temperature: null,
    measure_humidity: null,
    measure_battery: null,
  },
  'Z-TRM2fx': {
    thermofloor_mode: 1,
    target_temperature: 1,
    thermofloor_onoff: 1,
    meter_power: 1,
    measure_power: 1,
    measure_voltage: 1,
    'measure_temperature.external': 2,
    'measure_temperature.floor': 3,
    'button.reset_meter': 1,
  },
  'Z-TRM3': {
    thermostat_mode_single: 1,
    target_temperature: 1,
    thermostat_state: 1,
    meter_power: 1,
    measure_power: 1,
    measure_voltage: 1,
    'measure_temperature.internal': 2,
    'measure_temperature.external': 3,
    'measure_temperature.floor': 4,
    'button.reset_meter': 1,
  },
};

'use strict';

const Homey = require('homey');
const { ZwaveDevice } = require('homey-meshdriver');
const maps = require('./Z-TRM/Thermostat-mode_single_mappings.js');

class ThermostatDeviceSingleMode extends ZwaveDevice {

  async onMeshInit() {
    this.registerCapability('thermostat_mode_single', 'THERMOSTAT_MODE', {
      getOpts: {
        getOnStart: true,
      },
      get: 'THERMOSTAT_MODE_GET',
      set: 'THERMOSTAT_MODE_SET',
      setParserV3: thermostatMode => {
        this.log('Setting thermostat mode to:', thermostatMode);

        // 1. Update thermostat setpoint based on matching thermostat mode
        const setpointType = maps.Mode2Setpoint[thermostatMode];

        if (setpointType !== 'not supported') {
          this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatsetpointValue.${setpointType}`) || null);
        } else {
          this.setCapabilityValue('target_temperature', null);
        }

        // 2. Update device settings thermostat mode
        this.setSettings({
          operation_mode: maps.Mode2Number[thermostatMode],
        });

        // 3. Trigger mode trigger cards if the mode is actually changed
        if (this.getCapabilityValue('thermostat_mode_single') !== thermostatMode) {
          const thermostatModeObj = {
            mode: thermostatMode,
            mode_name: Homey.__(`mode.${thermostatMode}`),
          };
          Homey.app.triggerThermofloorModeChanged.trigger(this, thermostatModeObj, null);
          Homey.app.triggerThermostatModeChangedTo.trigger(this, null, thermostatModeObj);

          // 4. Update onoff state when the thermostat mode is off
          if (thermostatMode === 'Off') {
            this.setCapabilityValue('thermostatState', false);
          }
        }
        // 5. Return setParser object and update thermostat_mode_single capability
        return {
          Level: {
            'No of Manufacturer Data fields': 0,
            Mode: thermostatMode,
          },
          'Manufacturer Data': Buffer.from([0]),
        };
      },
      report: 'THERMOSTAT_MODE_REPORT',
      reportParserV3: report => {
        if (!report) return null;
        if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
          const thermostatMode = report.Level.Mode;
          this.log('Received thermostat mode report:', thermostatMode);

          // 1. Update thermostat setpoint value based on matching thermostat mode
          const setpointType = maps.Mode2Setpoint[thermostatMode];

          if (setpointType !== 'not supported') {
            this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatsetpointValue.${setpointType}`) || null);
          } else {
            this.setCapabilityValue('target_temperature', null);
          }

          // 2. Update device settings thermostat mode
          this.setSettings({
            operation_mode: maps.Mode2Number[thermostatMode],
          });

          // 3. Trigger mode trigger cards if the mode is actually changed
          if (this.getCapabilityValue('thermostat_mode_single') !== thermostatMode) {
            const thermostatModeObj = {
              mode: thermostatMode,
              mode_name: Homey.__(`mode.${thermostatMode}`),
            };
            Homey.app.triggerThermofloorModeChanged.trigger(this, thermostatModeObj, null);
            Homey.app.triggerThermostatModeChangedTo.trigger(this, null, thermostatModeObj);

            // 4. Update onoff state when the thermostat mode is off
            if (thermostatMode === 'Off') {
              this.setCapabilityValue('thermostatState', false);
            }
          }

          this.setCapabilityValue('onoff', thermostatMode === 'Heat');

          // 5. Return reportParser object and update thermostat_mode_single capability
          return thermostatMode;
        }
        return null;
      },
    });

    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
      getOpts: {
        getOnStart: true,
      },
      getParser: () => {
        // 1. Retrieve the setpointType based on the thermostat mode
        const setpointType = maps.Mode2Setpoint[this.getCapabilityValue('thermostat_mode_single') || 'Heat'];

        // 2. Return getParser object with correct setpointType
        return {
          Level: {
            'Setpoint Type': setpointType !== 'not supported' ? setpointType : 'Heating 1',
          },
        };
      },
      set: 'THERMOSTAT_SETPOINT_SET',
      setParserV3: setpointValue => {
        // 1. Retrieve the setpointType based on the thermostat mode
        const setpointType = maps.Mode2Setpoint[this.getCapabilityValue('thermostat_mode_single') || 'Heat'];

        this.log('Setting thermostat setpoint to:', setpointValue, 'for setpointType', setpointType);

        if (setpointType !== 'not supported') {
          // 2. Store thermostat setpoint based on thermostat type
          this.setStoreValue(`thermostatsetpointValue.${setpointType}`, setpointValue);

          // 3. Update device settings setpoint value
          const setpointSetting = maps.Setpoint2Setting[setpointType];
          this.setSettings({
            [setpointSetting]: setpointValue * 10,
          });

          // 4. Return setParser object and update thermostat mode
          const bufferValue = Buffer.alloc(2);
          bufferValue.writeUInt16BE((Math.round(setpointValue * 2) / 2 * 10).toFixed(0));

          return {
            Level: {
              'Setpoint Type': setpointType,
            },
            Level2: {
              Size: 2,
              Scale: 0,
              Precision: 1,
            },
            Value: bufferValue,
          };
        }

        return null;
      },
      report: 'THERMOSTAT_SETPOINT_REPORT',
      reportParserV3: report => {
        if (report && report.hasOwnProperty('Level2')
          && report.Level2.hasOwnProperty('Scale')
          && report.Level2.hasOwnProperty('Precision')
          && report.Level2.Scale === 0
          && typeof report.Level2.Size !== 'undefined') {
          // 1. Try to read the readValue
          let readValue;
          try {
            readValue = report.Value.readUIntBE(0, report.Level2.Size);
          } catch (err) {
            return null;
          }

          if (typeof readValue !== 'undefined') {
            // 2. Define the setPointValue and setpointType
            const setpointValue = readValue / 10 ** report.Level2.Precision; // Math.pow(10, report.Level2.Precision);
            const setpointType = report.Level['Setpoint Type'];
            this.log('Received thermostat setpoint report: Setpoint type', setpointType, ' Setpoint value', setpointValue);

            // 3. Store thermostat setpoint based on thermostat type
            if (setpointType !== 'not supported') {
              this.setStoreValue(`thermostatsetpointValue.${setpointType}`, setpointValue);
            }

            // 4. Update device settings setpoint value
            const setpointSetting = maps.Setpoint2Setting[setpointType];
            this.setSettings({
              [setpointSetting]: setpointValue * 10,
            });

            // 5. Update UI if reported setpointType equals active sepointType based on the thermostat mode
            if (setpointType === maps.Mode2Setpoint[this.getCapabilityValue('thermostat_mode_single') || 'Heat']) {
              this.log('Updated thermostat setpoint on UI to', setpointValue);
              return setpointValue;
            }

            return null;
          }
          return null;
        }
        return null;
      },
    });

    // register a capability listener
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));

    this.registerCapability('thermostat_state', 'THERMOSTAT_OPERATING_STATE', {
      getOpts: {
        getOnStart: true,
      },
      get: 'THERMOSTAT_OPERATING_STATE_GET',
      report: 'THERMOSTAT_OPERATING_STATE_REPORT',
      reportParser: report => {
        if (report && report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Operating State')) {
          const thermostatState = report.Level['Operating State'] === 'Heating';
          if (thermostatState !== this.getCapabilityValue('thermostatState')) {
            return thermostatState;
          }
        }
        return null;
      },
    });
  }

  // this method is called when the Device has requested a state change (turned on or off)
  async onCapabilityOnoff(value, opts) {
    await this.executeCapabilitySetCommand('thermostat_mode_single', 'THERMOSTAT_MODE', value ? 'Heat' : 'Off')
      .then(this.log('onoff set', value, value ? 'Heat' : 'Off'))
      .catch(this.error);
  }

  onModeAutocomplete(query, args, callback) {
    let resultArray = [];
    for (const modeID in maps.Mode2Number) {
      resultArray.push({
        id: modeID,
        name: Homey.__(Homey.__(`mode.${modeID}`)),
        capability: 'thermostat_mode_single',
      });
    }

    // filter for query
    resultArray = resultArray.filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    });
    this.log(resultArray);
    return Promise.resolve(resultArray);
  }

  /**
 * Method that determines if current node is root node.
 * @returns {boolean}
 * @private
 */
  _isRootNode() {
    return Object.prototype.hasOwnProperty.call(this.node, 'MultiChannelNodes') && Object.keys(this.node.MultiChannelNodes).length > 0;
  }

}

module.exports = ThermostatDeviceSingleMode;

'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

const MasterData = {
	'Energy Save Heat': {
		Mode: 'Energy Save Heat',
		Setpoint: 'Energy Save Heating',
		Setting: 'ECO_setpoint',
		Parameter: '11',
		Mode_no: '11',
	},
	Heat: {
		Mode: 'Heat',
		Setpoint: 'Heating 1',
		Setting: 'CO_setpoint',
		Parameter: '10',
		Mode_no: '1',
	},
	Cool: {
		Mode: 'Cool',
		Setpoint: 'Cooling 1',
		Setting: 'COOL_setpoint',
		Parameter: '13',
		Mode_no: '2',
	},
	Off: {
		Mode: 'Off',
		Mode_no: '0',
	},
};

// Create Mode2Setting array based on MasterData array
const Mode2Setting = {};
for (const mode in MasterData) {
	Mode2Setting[MasterData[mode].Mode] = MasterData[mode].Setting;
}

// Create Mode2Setpoint array based on MasterData array
const Mode2Setpoint = {};
for (const mode in MasterData) {
	Mode2Setpoint[MasterData[mode].Mode] = MasterData[mode].Setpoint;
}

// Create Setpoint2Setting array based on MasterData array
const Setpoint2Setting = {};
for (const mode in MasterData) {
	Setpoint2Setting[MasterData[mode].Setpoint] = MasterData[mode].Setting;
}

// Create Mode2Number array based on MasterData array
const Mode2Number = {};
for (const mode in MasterData) {
	Mode2Number[MasterData[mode].Mode] = MasterData[mode].Mode_no;
}


class TF_ThermostatDevice extends ZwaveDevice {
	async onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnOnline: true,
				getOnStart: true, // get the initial value on app start
				pollInterval: 'poll_interval_TEMPERATURE', // maps to device settings
				pollMultiplication: 60000,
			},
		});

		this.registerCapability('thermofloor_onoff', 'BASIC_SET');

		this.registerCapability('thermofloor_mode', 'THERMOSTAT_MODE', {
			getOpts: {
				getOnOnline: true,
				getOnStart: true, // get the initial value on app start
				pollInterval: 'poll_interval_THERMOSTAT_MODE', // maps to device settings
				pollMultiplication: 60000,
			},
			get: 'THERMOSTAT_MODE_GET', // RAW NodeID, 0x40,0x02
			set: 'THERMOSTAT_MODE_SET',
			setParserV2: value => {
				this.log('Setting mode to:', value);
				// >>> Update thermostat setpoint based on matching thermostat mode
				const setPointType = mapMode2Setpoint[value];

				// Update setPoint Value or trigger get command to retrieve setpoint
				if (setPointType !== 'not supported') {
					this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatSetpointValue.${setPointType}`) || null);
				}
				else {
					this.setCapabilityValue('target_temperature', null);
				}

				// Update AC_onoff capability
				this.setCapabilityValue('AC_onoff', value !== 'Off');

				// Update thermostat mode
				this.setStoreValue(`thermostatSetpointType`, setPointType);

				return {
					Level: {
						'No of Manufacturer Data fields': 0,
						Mode: value,
					},
					'Manufacturer Data': new Buffer([0]),
				};
			},
			report: 'THERMOSTAT_MODE_REPORT',
			reportParserV2: report => {
				if (!report) return null;
				if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
					this.log('Mode Report received:', report.Level.Mode);

					// Update thermostat setpoint based on matching thermostat mode
					const setPointType = mapMode2Setpoint[report.Level.Mode];
					this.setStoreValue(`thermostatSetpointType`, setPointType);
					// Update setPoint Value or trigger get command to retrieve setpoint
					if (setPointType !== 'not supported') {
						this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatSetpointValue.${setPointType}`) || null);
					}
					else {
						this.setCapabilityValue('target_temperature', null);
					}
					this.log('Updated Thermostat setpoint Type', setPointType);

					// Update AC_onoff capability
					this.setCapabilityValue('AC_onoff', report.Level.Mode !== 'Off');

					// Update thermostat mode
					return report.Level.Mode;
				}
				return null;
			},
		});

		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			getOpts: {
				getOnStart: true,
				pollInterval: 'poll_interval_THERMOSTAT_SETPOINT', // maps to device settings
				pollMultiplication: 60000,
			},
			getParser: () => {
				const setPointType = (this.getStoreValue(`thermostatSetpointType`) !== 'not supported' ? this.getStoreValue(`thermostatSetpointType`) || 'Heating 1' : 'Heating 1')
				return {
					Level: {
						'Setpoint Type': setPointType,
					},
				};
			},
			set: 'THERMOSTAT_SETPOINT_SET',
			setParser(value) {

				// Create value buffer
				const bufferValue = new Buffer(2);
				bufferValue.writeUInt16BE((Math.round(value * 2) / 2 * 10).toFixed(0));
				const setPointType = this.getStoreValue(`thermostatSetpointType`) || 'Heating 1';

				// Store the reported setpointValue if supported
				if (mapMode2Setpoint.setPointType !== 'not supported') {
					this.setStoreValue(`thermostatSetpointValue.${setPointType}`, value);
				}

				return {
					Level: {
						'Setpoint Type': setPointType,
					},
					Level2: {
						Size: 2,
						Scale: 0,
						Precision: 1,
					},
					Value: bufferValue,
				};
			},
			report: 'THERMOSTAT_SETPOINT_REPORT',
			reportParser: report => {
				if (report && report.hasOwnProperty('Level2') &&
					report.Level2.hasOwnProperty('Scale') &&
					report.Level2.hasOwnProperty('Precision') &&
					report.Level2.Scale === 0 &&
					typeof report.Level2.Size !== 'undefined') {

					let readValue;
					try {
						readValue = report.Value.readUIntBE(0, report.Level2.Size);
					}
					catch (err) {
						return null;
					}

					if (typeof readValue !== 'undefined') {
						const setPointValue = readValue / Math.pow(10, report.Level2.Precision);
						const setPointType = report.Level['Setpoint Type'];

						this.log('Setpoint Report received: Setpoint type', setPointType, ' Setpoint value', setPointValue);

						// Store the reported setpointValue if supported
						if (mapMode2Setpoint.setPointType !== 'not supported') {
							this.setStoreValue(`thermostatSetpointValue.${setPointType}`, setPointValue);
						}
						// If setPointType === this.thermostatSetpointType, return the setPointValue to update the UI, else return nul
						if (setPointType === this.getStoreValue('thermostatSetpointType')) {
							this.log('Thermostat setpoint updated on UI to', setPointValue);
							return setPointValue;
						}

						return null;
					}
					return null;
				}
				return null;
			},
		});

		// Registere triggerCapabilityListener

		//thermofloor_mode_changed

		//thermofloor_mode_changed_to


		// Register actions for flows thermofloor_change_mode
		this._actionZXTThermostatMode = new Homey.FlowCardAction('action_ZXT_SetMode')
			.register()
			.registerRunListener((args, state) => {
				this.log('FlowCardAction triggered for ', args.device.getName(), 'to change Thermostat mode to', args.mode);
				return args.device.triggerCapabilityListener('AC_mode', args.mode, {});
			});

		// Register actions for flows
		this._actionZXTSetThermostatSetpoint = new Homey.FlowCardAction('action_ZXT_SetSetpoint')
			.register()
			.registerRunListener(this._actionZXTSetThermostatSetpointRunListener.bind(this));
	}

	// thermofloor_change_mode_setpoint
	async _actionZXTSetThermostatSetpointRunListener(args, state) {
		this.log('FlowCardAction triggered for ', args.device.getName(), 'to change setpoint value', args.setPointValue, 'for', args.setPointType);

		if (!args.hasOwnProperty('setPointType')) return Promise.reject('setPointType_property_missing');
		if (!args.hasOwnProperty('setPointValue')) return Promise.reject('setPointValue_property_missing');
		if (typeof args.setPointValue !== 'number') return Promise.reject('setPointValue_is_not_a_number');

		// Create value buffer
		const bufferValue = new Buffer(2);
		bufferValue.writeUInt16BE((Math.round(args.setPointValue * 2) / 2 * 10).toFixed(0));
		const setPointType = args.setPointType;
		const setPointValue = args.setPointValue;

		// Store the reported setpointValue if supported

		args.device.thermostatSetpointValue[setPointType] = setPointValue;
		args.device.log('thermostatSetpointValue updated', args.device.thermostatSetpointValue);

		if (args.device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT) {
			return await args.device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT.THERMOSTAT_SETPOINT_SET({
				Level: {
					'Setpoint Type': setPointType,
				},
				Level2: {
					Size: 2,
					Scale: 0,
					Precision: 1,
				},
				Value: bufferValue,
			});
		}
		return Promise.reject('unknown_error');
	}
}
module.exports = TF_ThermostatDevice;
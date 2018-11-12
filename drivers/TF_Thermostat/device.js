'use strict';

const Homey = require('homey');

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

// Create mapMode2Setting array based on MasterData array
const mapMode2Setting = {};
for (const mode in MasterData) {
	mapMode2Setting[MasterData[mode].Mode] = MasterData[mode].Setting;
}

// Create mapMode2Setpoint array based on MasterData array
const mapMode2Setpoint = {};
for (const mode in MasterData) {
	mapMode2Setpoint[MasterData[mode].Mode] = MasterData[mode].Setpoint;
}

// Create mapSetpoint2Setting array based on MasterData array
const mapSetpoint2Setting = {};
for (const mode in MasterData) {
	mapSetpoint2Setting[MasterData[mode].Setpoint] = MasterData[mode].Setting;
}

// Create mapMode2Number array based on MasterData array
const mapMode2Number = {};
for (const mode in MasterData) {
	mapMode2Number[MasterData[mode].Mode] = MasterData[mode].Mode_no;
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

		this.registerCapability('thermofloor_onoff', 'BASIC', {
			report: 'BASIC_SET',
			reportParser: report => {
				if (report && report.hasOwnProperty('Value')) return report.Value === 255;
				return null;
			}
		});

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
					this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatsetPointValue.${setPointType}`) || null);
				}
				else {
					this.setCapabilityValue('target_temperature', null);
				}

				// Update thermofloor_onoff capability
				// this.setCapabilityValue('thermofloor_onoff', value !== 'Off');

				// Update thermostat mode in Store
				this.setStoreValue(`thermostatsetPointType`, setPointType);

				// >>>>// FIXME:
				/*
				// Trigger mode trigger cards
				this.triggerThermofloorModeChanged.trigger(this, {
					mode: report.Level.Mode,
					mode_name: Homey.__("mode." + report.Level.Mode),
				}, null);
				this.triggerThermofloorModeChangedTo.trigger(this, null, {
					mode: report.Level.Mode
				}, );
				*/

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
					this.setStoreValue(`thermostatsetPointType`, setPointType);
					// Update setPoint Value or trigger get command to retrieve setpoint
					if (setPointType !== 'not supported') {
						this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatsetPointValue.${setPointType}`) || null);
					}
					else {
						this.setCapabilityValue('target_temperature', null);
					}
					this.log('Updated Thermostat setpoint Type', setPointType);

					// Update thermofloor_onoff capability
					// this.setCapabilityValue('thermofloor_onoff', report.Level.Mode !== 'Off');

					this.triggerThermofloorModeChanged.trigger(this, {
						mode: report.Level.Mode,
						mode_name: Homey.__("mode." + report.Level.Mode),
					}, null);
					this.triggerThermofloorModeChangedTo.trigger(this, null, {
						mode: report.Level.Mode
					}, );

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
				const setPointType = (this.getStoreValue(`thermostatsetPointType`) !== 'not supported' ? this.getStoreValue(`thermostatsetPointType`) || 'Heating 1' : 'Heating 1')
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
				const setPointType = this.getStoreValue(`thermostatsetPointType`) || 'Heating 1';

				// Store the reported setPointValue if supported
				if (mapMode2Setpoint.setPointType !== 'not supported') {
					this.setStoreValue(`thermostatsetPointValue.${setPointType}`, value);
				}
				// function updateSetpoint(node, setPointValue, setpointMode)
				if (setPointType !== 'Off') {
					const setpointSetting = mapSetpoint2Setting[setPointType];
					this.log('SETPOINT CHANGE - Update setting:', setpointSetting, 'with the setpoint value:', value * 10);
					this.setSettings({
						[setpointSetting]: value * 10
					});
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

						// function updateSetpoint(node, setPointValue, setpointMode)

						if (setPointType !== 'Off') {
							const setpointSetting = mapSetpoint2Setting[setPointType];
							this.log('SETPOINT CHANGE - Update setting:', setpointSetting, 'with the setpoint value:', setPointValue * 10);
							this.setSettings({
								[setpointSetting]: setPointValue * 10
							});
						}

						this.log('Setpoint Report received: Setpoint type', setPointType, ' Setpoint value', setPointValue);

						// Store the reported setPointValue if supported
						if (mapMode2Setpoint.setPointType !== 'not supported') {
							this.setStoreValue(`thermostatsetPointValue.${setPointType}`, setPointValue);
						}
						// If setPointType === this.thermostatsetPointType, return the setPointValue to update the UI, else return nul
						if (setPointType === this.getStoreValue('thermostatsetPointType')) {
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
		this.triggerThermofloorModeChanged = new Homey.FlowCardTriggerDevice('thermofloor_mode_changed');
		this.triggerThermofloorModeChanged
			.register();

		//thermofloor_mode_changed_to
		this.triggerThermofloorModeChangedTo = new Homey.FlowCardTriggerDevice('thermofloor_mode_changed_to');
		this.triggerThermofloorModeChangedTo
			.register()
			.registerRunListener((args, state) =>
				Promise.resolve(args.mode === state.mode));

		// Register actions for flows thermofloor_change_mode
		this._actionThermofloorChangeMode = new Homey.FlowCardAction('thermofloor_change_mode')
			.register()
			.registerRunListener((args, state) => {
				this.log('FlowCardAction triggered for ', args.device.getName(), 'to change Thermostat mode to', args.mode);
				return args.device.triggerCapabilityListener('thermofloor_mode', args.mode, {});
			});

		// Register actions for flows
		this._actionThermofloorChangeSetpoint = new Homey.FlowCardAction('thermofloor_change_mode_setpoint')
			.register()
			.registerRunListener(this._actionThermofloorChangeSetpointRunListener.bind(this));
	}

	// thermofloor_change_mode_setpoint
	async _actionThermofloorChangeSetpointRunListener(args, state) {
		this.log('FlowCardAction triggered for ', args.device.getName(), 'to change setpoint value', args.setPointValue, 'for', args.setPointMode);

		if (!args.hasOwnProperty('setPointMode')) return Promise.reject('setPointMode_property_missing');
		if (!args.hasOwnProperty('setPointValue')) return Promise.reject('setPointValue_property_missing');
		if (typeof args.setPointValue !== 'number') return Promise.reject('setPointValue_is_not_a_number');

		// Create value buffer
		const bufferValue = new Buffer(2);
		bufferValue.writeUInt16BE((Math.round(args.setPointValue * 2) / 2 * 10).toFixed(0));
		const setPointType = mapMode2Setpoint[args.setPointMode];
		const setPointValue = args.setPointValue;

		// Store the reported setPointValue if supported

		this.setStoreValue(`thermostatsetPointValue.${setPointType}`, setPointValue);
		this.log('thermostatsetPointValue ', setPointType, ' updated to:', setPointValue);

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
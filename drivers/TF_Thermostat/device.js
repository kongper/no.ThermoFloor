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
		Setpoint: 'not supported',
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

		// registerCapability for measure_temperature for FW <=18.
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnStart: true,
				pollInterval: 'poll_interval_TEMPERATURE',
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
				getOnStart: true,
				// pollInterval: 'poll_interval_THERMOSTAT_MODE',
				// pollMultiplication: 60000,
			},
			get: 'THERMOSTAT_MODE_GET',
			set: 'THERMOSTAT_MODE_SET',
			setParserV2: thermostatMode => {
				this.log('Setting thermostat mode to:', thermostatMode);

				// 1. Update thermostat setpoint based on matching thermostat mode
				const setpointType = mapMode2Setpoint[thermostatMode];

				if (setpointType !== 'not supported') {
					this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatsetpointValue.${setpointType}`) || null);
				}
				else {
					this.setCapabilityValue('target_temperature', null);
				}

				// 2. Update device settings thermostat mode
				this.setSettings({
					'operation_mode': mapMode2Number[thermostatMode]
				});

				// 3. Trigger mode trigger cards if the mode is actually changed
				if (this.getCapabilityValue('thermofloor_mode') != thermostatMode) {
					const thermostatModeObj = {
						mode: thermostatMode,
						mode_name: Homey.__("mode." + thermostatMode),
					};
					this.triggerThermofloorModeChanged.trigger(this, thermostatModeObj, null);
					this.triggerThermofloorModeChangedTo.trigger(this, null, thermostatModeObj, );

					// 4. Update onoff state when the thermostat mode is off
					if (thermostatMode === 'Off') {
						this.setCapabilityValue('thermofloor_onoff', false);
					}
				}
				// 5. Return setParser object and update thermofloor_mode capability
				return {
					Level: {
						'No of Manufacturer Data fields': 0,
						Mode: thermostatMode,
					},
					'Manufacturer Data': new Buffer([0]),
				};
			},
			report: 'THERMOSTAT_MODE_REPORT',
			reportParserV2: report => {
				if (!report) return null;
				if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
					const thermostatMode = report.Level.Mode;
					this.log('Received thermostat mode report:', thermostatMode);

					// 1. Update thermostat setpoint value based on matching thermostat mode
					const setpointType = mapMode2Setpoint[thermostatMode];

					if (setpointType !== 'not supported') {
						this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatsetpointValue.${setpointType}`) || null);
					}
					else {
						this.setCapabilityValue('target_temperature', null);
					}

					// 2. Update device settings thermostat mode
					this.setSettings({
						operation_mode: mapMode2Number[thermostatMode]
					});

					// 3. Trigger mode trigger cards if the mode is actually changed
					if (this.getCapabilityValue('thermofloor_mode') != thermostatMode) {
						const thermostatModeObj = {
							mode: thermostatMode,
							mode_name: Homey.__("mode." + thermostatMode),
						};
						this.triggerThermofloorModeChanged.trigger(this, thermostatModeObj, null);
						this.triggerThermofloorModeChangedTo.trigger(this, null, thermostatModeObj);

						// 4. Update onoff state when the thermostat mode is off
						if (thermostatMode === 'Off') {
							this.setCapabilityValue('thermofloor_onoff', false);
						}
					};

					// 5. Return reportParser object and update thermofloor_mode capability
					return thermostatMode;
				}
				return null;
			},
		});

		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			getOpts: {
				getOnStart: true,
				// pollInterval: 'poll_interval_THERMOSTAT_SETPOINT',
				// pollMultiplication: 60000,
			},
			getParser: () => {
				// 1. Retrieve the setpointType based on the thermostat mode
				const setpointType = mapMode2Setpoint[this.getCapabilityValue('thermofloor_mode') || 'Heat'];

				// 2. Return getParser object with correct setpointType
				return {
					Level: {
						'Setpoint Type': setpointType !== 'not supported' ? setpointType : 'Heating 1',
					},
				};
			},
			set: 'THERMOSTAT_SETPOINT_SET',
			setParser(setpointValue) {
				// 1. Retrieve the setpointType based on the thermostat mode
				const setpointType = mapMode2Setpoint[this.getCapabilityValue('thermofloor_mode') || 'Heat'];

				this.log('Setting thermostat setpoint to:', setpointValue, 'for setpointType', setpointType);

				if (setpointType !== 'not supported') {
					// 2. Store thermostat setpoint based on thermostat type
					this.setStoreValue(`thermostatsetpointValue.${setpointType}`, setpointValue);

					// 3. Update device settings setpoint value
					const setpointSetting = mapSetpoint2Setting[setpointType];
					this.setSettings({
						[setpointSetting]: setpointValue * 10
					});

					// 4. Return setParser object and update thermostat mode
					const bufferValue = new Buffer(2);
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
				};

				return null

			},
			report: 'THERMOSTAT_SETPOINT_REPORT',
			reportParser: report => {
				if (report && report.hasOwnProperty('Level2') &&
					report.Level2.hasOwnProperty('Scale') &&
					report.Level2.hasOwnProperty('Precision') &&
					report.Level2.Scale === 0 &&
					typeof report.Level2.Size !== 'undefined') {

					// 1. Try to read the readValue
					let readValue;
					try {
						readValue = report.Value.readUIntBE(0, report.Level2.Size);
					}
					catch (err) {
						return null;
					}

					if (typeof readValue !== 'undefined') {

						// 2. Define the setPointValue and setpointType
						const setpointValue = readValue / Math.pow(10, report.Level2.Precision);
						const setpointType = report.Level['Setpoint Type'];
						this.log('Received thermostat setpoint report: Setpoint type', setpointType, ' Setpoint value', setpointValue);

						// 3. Store thermostat setpoint based on thermostat type
						if (setpointType !== 'not supported') {
							this.setStoreValue(`thermostatsetpointValue.${setpointType}`, setpointValue);
						}

						// 4. Update device settings setpoint value
						const setpointSetting = mapSetpoint2Setting[setpointType];
						this.setSettings({
								[setpointSetting]: setpointValue * 10
						});

						// 5. Update UI if reported setpointType equals active sepointType based on the thermostat mode
						if (setpointType === mapMode2Setpoint[this.getCapabilityValue('thermofloor_mode') || 'Heat']) {
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
				const thermostatMode = args.mode;
				this.log('FlowCardAction triggered for ', args.device.getName(), 'to change Thermostat mode to', thermostatMode);

				// Trigger the thermostat mode setParser
				return args.device.triggerCapabilityListener('thermofloor_mode', thermostatMode, {});
			});

		// Register actions for flows
		this._actionThermofloorChangeSetpoint = new Homey.FlowCardAction('thermofloor_change_mode_setpoint')
			.register()
			.registerRunListener(this._actionThermofloorChangeSetpointRunListener.bind(this));
	}

	// thermofloor_change_mode_setpoint
	async _actionThermofloorChangeSetpointRunListener(args, state) {

		if (!args.hasOwnProperty('setpointMode')) return Promise.reject('setpointMode_property_missing');
		if (!args.hasOwnProperty('setpointValue')) return Promise.reject('setpointValue_property_missing');
		if (typeof args.setpointValue !== 'number') return Promise.reject('setpointValue_is_not_a_number');

		// 1. Retrieve the setpointType based on the thermostat mode
		const setpointType = mapMode2Setpoint[args.setpointMode];
		const setpointValue = args.setpointValue;
		this.log('FlowCardAction triggered for ', args.device.getName(), 'to change setpoint value', setpointValue, 'for', setpointType);

		// 2. Store thermostat setpoint based on thermostat type
		this.setStoreValue(`thermostatsetpointValue.${setpointType}`, setpointValue);

		// 3. Update device settings setpoint value
		const setpointSetting = mapSetpoint2Setting[setpointType];
		this.setSettings({
			[setpointSetting]: setpointValue * 10
		});

		// 5. Update UI if reported setpointType equals active sepointType based on the thermostat mode
		if (setpointType === mapMode2Setpoint[this.getCapabilityValue('thermofloor_mode') || 'Heat']) {
			this.log('Updated thermostat setpoint on UI to', setpointValue);
			this.setCapabilityValue('target_temperature', setpointValue);
		}

		// 6. Trigger command to update device setpoint
		const bufferValue = new Buffer(2);
		bufferValue.writeUInt16BE((Math.round(setpointValue * 2) / 2 * 10).toFixed(0));

		if (args.device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT) {
			return await args.device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT.THERMOSTAT_SETPOINT_SET({
				Level: {
					'Setpoint Type': setpointType,
				},
				Level2: {
					Size: 2,
					Scale: 0,
					Precision: 1,
				},
				Value: bufferValue,
			});

			return Promise.reject('unknown_error');
		}
	}
}

module.exports = TF_ThermostatDevice;
'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');
const Mode2Setpoint = {
	'Energy Save Heat': {
		Setpoint: 'Energy Save Heating',
		Setting: 'ECO_setpoint',
	},
	Heat: {
		Setpoint: 'Heating 1',
		Setting: 'CO_setpoint',
	},
	Cool: {
		Setpoint: 'Cooling 1',
		Setting: 'COOL_setpoint',
	},
};
const Setpoint2Setting = {
	'Energy Save Heating': {
		Setting: 'ECO_setpoint',
	},
	'Heating 1': {
		Setting: 'CO_setpoint',
	},
	'Cooling 1': {
		Setting: 'COOL_setpoint',
	},
};

// http://products.z-wavealliance.org/products/1584

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		measure_temperature: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Temperature (version 1)',
				Properties1: {
					Scale: 0,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (!report) return null;
				if (report['Sensor Type'] === 'Temperature (version 1)') return report['Sensor Value (Parsed)'];
				return null;
			},
			pollInterval: 'poll_interval',
		},
		target_temperature: {
			command_class: 'COMMAND_CLASS_THERMOSTAT_SETPOINT',
			command_get: 'THERMOSTAT_SETPOINT_GET',
			command_get_parser: node => {
				// check in case of COOL
				let mode = 'Heating 1';
				if (node && typeof node.state.thermofloor_mode !== 'undefined') {
					mode = Mode2Setpoint[node.state.thermofloor_mode].Setpoint;
				}
				//const node_mode = node.state.thermofloor_mode;
				Homey.log('SETPOINT_GET Setpoint', mode);
				return {
					Level: {
						'Setpoint Type': mode,
					},
				};
			},
			command_set: 'THERMOSTAT_SETPOINT_SET',
			command_set_parser: (value, node) => {
				// Create 2 byte buffer of value, with value rounded to xx.5
				if (!value) value = 18;
				let newTemp = new Buffer(2);
				newTemp.writeUIntBE((value * 2).toFixed() / 2 * 10, 0, 2);

				let mode = 'Heating 1';
				if (node && typeof node.state.thermofloor_mode !== 'undefined') {
					mode = Mode2Setpoint[node.state.thermofloor_mode].Setpoint;
				}
				// Update setting based on reported setpoint
				const updateSetting = Setpoint2Setting[mode].Setting;
				module.exports._debug('New Setpoint SET to: ', value * 10, 'update setting : ', updateSetting);
				module.exports.setSettings(node.device_data, {
					[updateSetting]: value * 10,
				});
				return {
					Level: {
						'Setpoint Type': mode,
					},
					Level2: {
						Precision: 1, // Number has one decimal
						Scale: 0, // No scale used
						Size: 2, // Value = 2 Bytes
					},
					Value: newTemp,
				};
			},
			command_report: 'THERMOSTAT_SETPOINT_REPORT',
			command_report_parser: (report, node) => {
				if (report &&
					report.hasOwnProperty('Value') &&
					report.hasOwnProperty('Level2') &&
					typeof report.Level2.Precision === 'number' &&
					typeof report.Level2.Size === 'number') {
					let targetValue;
					try {
						targetValue = report.Value.readUIntBE(0, report.Level2.Size);
					}
					catch (err) {
						return null;
					}

					// Update setting based on reported setpoint
					if (typeof targetValue === 'number') {
						const newtargetValue = targetValue / Math.pow(10, report.Level2.Precision);
						const reportSetpoint = report.Level['Setpoint Type'];
						// report back new values to debug log
						module.exports._debug('New Setpoint report received, Setpoint: ',
							reportSetpoint, ' and new target value: ', newtargetValue);

						// Update setting based on reported setpoint
						if (typeof node.state.thermofloor_mode !== 'undefined' && node.state.thermofloor_mode !== 'Off') {
							const updateSetting = Setpoint2Setting[reportSetpoint].Setting;
							module.exports._debug('New setpoint REPORTED: ', targetValue, 'update setting: ', updateSetting);
							module.exports.setSettings(node.device_data, {
								[updateSetting]: targetValue,
							});
						}
						// Update target_temperature state only if reported setpoint matches the current thermostat mode state
						if (typeof node.state.thermofloor_mode !== 'undefined' &&
							Mode2Setpoint[node.state.thermofloor_mode].Setpoint === report.Level['Setpoint Type']) {
							module.exports._debug('Target Temperature state will be updated to: ', newtargetValue);
							return newtargetValue;
						}
						return null;
					}
				}
				return null;
			},
		},
		thermofloor_onoff: {
			command_class: 'COMMAND_CLASS_BASIC',
			command_report: 'BASIC_SET',
			command_report_parser: report => {
				Homey.log('thermofloor_onoff state:', report.Value === 255);
				return report.Value === 255;
			},
		},
		thermofloor_mode: {
			command_class: 'COMMAND_CLASS_THERMOSTAT_MODE',
			command_get: 'THERMOSTAT_MODE_GET',
			command_set: 'THERMOSTAT_MODE_SET',
			command_set_parser: (value, node) => {
				updateSetpoint(node, 'mode', node.state.thermofloor_mode, null);
				return {
					Level: {
						'No of Manufacturer Data fields': 0,
						Mode: value,
					},
					'Manufacturer Data': new Buffer([0]),
				};
			},
			command_report: 'THERMOSTAT_MODE_REPORT',
			command_report_parser: (report, node) => {
				if (!report) return null;
				if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
					if (node) {
						updateSetpoint(node, 'mode', report.Level.Mode, null);
						Homey.manager('flow').triggerDevice('thermofloor_mode_changed', {
							mode: report.Level.Mode,
							mode_name: __("mode." + report.Level.Mode)
						}, null, node.device_data);
						Homey.manager('flow').triggerDevice('thermofloor_mode_changed_to', null, {
							mode: report.Level.Mode
						}, node.device_data);
					}
					return report.Level.Mode;
				}
				return null;
			},
		}
	},
	settings: {
		operation_mode: {
			index: 1,
			size: 2,
		},
		temp_sensor: {
			index: 2,
			size: 2,
		},
		floor_sensor: {
			index: 3,
			size: 2,
		},
		temperature_control_hysteresis: {
			index: 4,
			size: 2,
		},
		FLO_floor_min: {
			index: 5,
			size: 2,
		},
		FHI_floor_max: {
			index: 6,
			size: 2,
		},
		ALO_air_min: {
			index: 7,
			size: 2,
		},
		AHI_air_max: {
			index: 8,
			size: 2,
		},
		PLO_temp_min: {
			index: 9,
			size: 2,
		},
		CO_setpoint: {
			index: 10,
			size: 2,
		},
		ECO_setpoint: {
			index: 11,
			size: 2,
		},
		P_setting: {
			index: 12,
			size: 2,
		},
		COOL_setpoint: {
			index: 13,
			size: 2,
		},
	},
});

Homey.manager('flow').on('trigger.thermofloor_mode_changed_to', (callback, args, state) => {
	if (!args) return callback('arguments_error', false);
	else if (!state) return callback('state_error', false);

	else if (typeof args.mode !== 'undefined' && typeof state.mode !== 'undefined' && args.mode === state.mode) return callback(null, true);
	else return callback('unknown_error', false);
});

function updateSetpoint(node, origen, mode, report) {
	if (typeof mode !== 'undefined' && mode !== 'Off') {
		Homey.log(origen, Mode2Setpoint[mode].Setpoint);
		Homey.log(origen, Mode2Setpoint[mode].Setting);
		// if (typeof report !== 'undefined' && typeof report.Level !== 'undefined') {
		//	Homey.log('SETPOINT_REPORT Setpoint type [report]:', report.Level['Setpoint Type']);
		// }
		if (origen === 'mode') {

			//	module.exports.realtime(node.device_data, 'target_temperature', 'temperature');
			// module.exports._debug('mode instance', node.instance.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT.THERMOSTAT_SETPOINT_GET({
			//	Level: {
			//		'Setpoint Type': Mode2Setpoint[mode].Setpoint
			//	}
			// }));
			// module.exports.setSettings(node.device_data, {
			//	forced_brightness_level: parsedForcedBrightnessLevel,
			// });
		}
	}
}

'use strict';

const TF_ThermostatDevice = require('./../TF_Thermostat/device');

class TF_ThermostatFW192Device extends TF_ThermostatDevice {
	async onMeshInit() {
		// await super.onMeshInit();

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// registerCapability for measure_temperature for FW <=18.
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnStart: true,
			},
			multiChannelNodeId: 2,
		});

		// registerCapability for measure_temperature for FW <=18.
		this.registerCapability('measure_temperature.floor', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnStart: true,
			},
			multiChannelNodeId: 3,
		});

		// registerCapability for measure_temperature for FW <=18.
		this.registerCapability('measure_temperature.external', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnStart: true,
			},
			multiChannelNodeId: 4,
		});

		this._brightnessAction = new Homey.FlowCardAction('TF_set_PowerRegulatorMode')
			.register()
			.registerRunListener(this._setPowerRegulatorMode.bind(this));

	}

	async _setPowerRegulatorMode(args, state) {
		if (!args.hasOwnProperty('set_power_regulator_mode')) return Promise.reject('set_power_regulator_mode_property_missing');
		if (typeof args.set_power_regulator_mode !== 'number') return Promise.reject('set_power_regulator_mode_is_not_a_number');
		if (args.set_forced_brightness_level > 10) return Promise.reject('set_power_regulator_mode_out_of_range');

		try {
			let result = await args.device.configurationSet({
				id: 'P_setting'
			}, args.set_power_regulator_mode);
			return args.device.setSettings({
				'P_setting': args.set_power_regulator_mode
			});
		}
		catch (error) {
			args.device.log(error.message);
			return Promise.reject(error.message);
		}
		return Promise.reject('unknown_error');
	}
}

module.exports = TF_ThermostatFW192Device;
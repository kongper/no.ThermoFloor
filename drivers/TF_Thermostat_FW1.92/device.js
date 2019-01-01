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
		this.registerCapability('measure_temperature,internal', 'SENSOR_MULTILEVEL', {
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

	}

}

module.exports = TF_ThermostatFW192Device;
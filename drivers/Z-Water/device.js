'use strict';

const Homey = require('homey');

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;
const util = require('./../../lib/util');

class Z_WaterDevice extends ZwaveDevice {
	async onMeshInit() {

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		if (this.hasCapability('measure_temperature.input1')) {
			this.registerCapability('onoff', 'BASIC', {
				getOpts: {
					getOnStart: true,
				},
				multiChannelNodeId: 1
			});

			this.registerCapability('measure_temperature.input1', 'SENSOR_MULTILEVEL', {
				getOpts: {
					getOnStart: true,
					// pollInterval: 'poll_interval_TEMPERATURE',
					// pollMultiplication: 60000,
				},
				multiChannelNodeId: 11
			});

			this.node.MultiChannelNodes['11'].on('unknownReport', buf => {
					if (buf.length === 6) {
						const value = util.calculateTemperature(buf);
						this.setCapabilityValue('measure_temperature.input1', value);
					}
			})

			this.registerCapability('measure_temperature.input2', 'SENSOR_MULTILEVEL', {
				getOpts: {
					getOnStart: true,
					// pollInterval: 'poll_interval_TEMPERATURE',
					// pollMultiplication: 60000,
				},
				multiChannelNodeId: 12
			});

			this.node.MultiChannelNodes['12'].on('unknownReport', buf => {
					if (buf.length === 6) {
						const value = util.calculateTemperature(buf);
						this.setCapabilityValue('measure_temperature.input2', value);
					}
			})

			this.registerCapability('measure_temperature.input3', 'SENSOR_MULTILEVEL', {
				getOpts: {
					getOnStart: true,
					// pollInterval: 'poll_interval_TEMPERATURE',
					// pollMultiplication: 60000,
				},
				multiChannelNodeId: 13
			});

			this.node.MultiChannelNodes['13'].on('unknownReport', buf => {
					if (buf.length === 6) {
						const value = util.calculateTemperature(buf);
						this.setCapabilityValue('measure_temperature.input3', value);
					}
			})

			this.registerCapability('measure_temperature.input4', 'SENSOR_MULTILEVEL', {
				getOpts: {
					getOnStart: true,
					// pollInterval: 'poll_interval_TEMPERATURE',
					// pollMultiplication: 60000,
				},
				multiChannelNodeId: 14
			});

			this.node.MultiChannelNodes['14'].on('unknownReport', buf => {
					if (buf.length === 6) {
						const value = util.calculateTemperature(buf);
						this.setCapabilityValue('measure_temperature.input4', value);
					}
			})

			this.registerSetting('Temperature_report_interval_input1', value => Math.floor(value/10));
			this.registerSetting('Temperature_report_interval_input2', value => Math.floor(value/10));
			this.registerSetting('Temperature_report_interval_input3', value => Math.floor(value/10));
			this.registerSetting('Temperature_report_interval_input4', value => Math.floor(value/10));

		}

		if (this.hasCapability('onoff') && !this.hasCapability('measure_temperature.input1')) {
			this.registerCapability('onoff', 'BASIC', {
				getOpts: {
					getOnStart: true,
				},
			});
		}

	}

}

module.exports = Z_WaterDevice;

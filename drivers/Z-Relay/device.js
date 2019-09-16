'use strict';

const Homey = require('homey');
const util = require('./../../lib/util');

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class Z_RelayDevice extends ZwaveDevice {
	async onMeshInit() {

		// enable debugging
		//this.enableDebug();

		// print the node's info to the console
		//this.printNode();

		this.registerCapability('onoff', 'SWITCH_BINARY', {
			getOpts: {
				getOnStart: true,
			},
			// multiChannelNodeId: 1
		});

		this.registerCapability('measure_power', 'METER');
		this.registerCapability('measure_voltage', 'METER');
		this.registerCapability('measure_current', 'METER');
		this.registerCapability('meter_power', 'METER');

		this.registerCapability('measure_temperature.input1', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 2
		});

		this.node.MultiChannelNodes['2'].on('unknownReport', buf => {
				if (buf.length === 6) {
					const value = util.calculateTemperature(buf);
					this.log('temperature input1', buf, value);
					this.setCapabilityValue('measure_temperature.input1', value);
				}
		})

		this.registerCapability('measure_temperature.input2', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 3
		});

		this.node.MultiChannelNodes['3'].on('unknownReport', buf => {
				if (buf.length === 6) {
					const value = util.calculateTemperature(buf);
					this.log('temperature input2', buf, value);
					this.setCapabilityValue('measure_temperature.input2', value);
				}
		})

		this.registerCapability('alarm_water', 'NOTIFICATION', {
			multiChannelNodeId: 4
		});

		this.registerCapability('alarm_water', 'BASIC', {
			report: 'BASIC_SET',
			reportParser: report => {
				if (report && report.hasOwnProperty('Value')) return report.Value === 255;
				return null;
			},
			multiChannelNodeId: 4
		});

		this.registerSetting('Temperature_report_interval_input1', value => Math.floor(value/10));
		this.registerSetting('Temperature_report_interval_input2', value => Math.floor(value/10));
		this.registerSetting('Temperature_report_interval_input3', value => Math.floor(value/10));
		this.registerSetting('Temperature_report_interval_input4', value => Math.floor(value/10));
		this.registerSetting('Meter_report_interval_relay', value => Math.floor(value/10));

	}

}

module.exports = Z_RelayDevice;

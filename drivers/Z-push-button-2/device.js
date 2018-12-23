'use strict';

const Homey = require('homey');

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class Z_PushButton_2 extends ZwaveDevice {
	async onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// supported scenes and their reported attribute numbers (all based on reported data)
		this.buttonMap = {
			Group2: {
				button: 'Group 2 (upper)',
			},
			Group3: {
				button: 'Group 3',
			},
			Group4: {
				button: 'Group 4',
			},
			Group5: {
				button: 'Group 5 (bottom)',
			},
		};

		this.sceneMap = {
			1: {
				scene: 'Key Pressed 1 time'
			},
			2: {
				scene: 'Key Pressed 2 times'
			},
			0: {
				scene: 'Key long pressed'
			},
		};

		// register device capabilities
		this.registerCapability('alarm_battery', 'BATTERY');
		this.registerCapability('measure_battery', 'BATTERY');

		// register a report listener (SDK2 style not yet operational)
		this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (rawReport, parsedReport) => {
			this.log('registerReportListener', rawReport, parsedReport);
			if (rawReport.hasOwnProperty('Properties1') &&
				rawReport.Properties1.hasOwnProperty('Key Attributes') &&
				rawReport.hasOwnProperty('Scene Number') &&
				rawReport.hasOwnProperty('Sequence Number')) {
				const remoteValue = {
					button: rawReport['Scene Number'].toString(),
					scene: rawReport.Properties1['Key Attributes'],
				};
				this.log('Triggering sequence:', rawReport['Sequence Number'], 'remoteValue', remoteValue);
				// Trigger the trigger card with 2 dropdown options
				// triggerSCN04_scene.trigger(this, triggerSCN04_scene.getArgumentValues, remoteValue);
				// Trigger the trigger card with tokens
				// triggerSCN_button.trigger(this, remoteValue, null);
			}
		});

	}

}

module.exports = Z_PushButton_2;
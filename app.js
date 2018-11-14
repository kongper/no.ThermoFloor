'use strict';

const Homey = require('homey');

class ThermoFloorApp extends Homey.App {
	onInit() {
		this.log(`${Homey.manifest.id} running...`);
	}
}

module.exports = ThermoFloorApp;
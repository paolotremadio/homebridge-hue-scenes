const fs = require('fs');
const { HueApi } = require('node-hue-api');
const debug = require('debug')('homebridge-hue-sceness');

const applyScene = require('./apply-scene');
const pkginfo = require('./package');

let Service;
let Characteristic;
let UUIDGen;
let storagePath;

class HueScenes {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;

    const { host, username, port } = config.bridge || {};
    this.hueApi = new HueApi(host, username, 10000, port || 80);

    this.loadScenes(config.scenesFile);

    this.createServices();
  }

  createServices() {
    // Random switch
    this.switchService = new Service.Switch(`${this.name} Random`, 'random');

    this.switchService
      .getCharacteristic(Characteristic.On)
      .on('get', callback => callback(null, false))
      .on('set', (on, callback) => this.setScene(null, on, callback, this.switchService));

    // Scene switches
    this.sceneSwitches = [];

    this.scenes.forEach((scene) => {
      const sceneSwitch = new Service.Switch(scene.name, UUIDGen.generate(scene.name));

      sceneSwitch
        .getCharacteristic(Characteristic.On)
        .on('get', callback => callback(null, false))
        .on('set', (on, callback) => this.setScene(scene, on, callback, sceneSwitch));

      this.sceneSwitches.push(sceneSwitch);
    });

    // Accessory info
    this.accessoryInformationService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, pkginfo.author.name || pkginfo.author)
      .setCharacteristic(Characteristic.Model, pkginfo.name)
      .setCharacteristic(Characteristic.SerialNumber, 'n/a')
      .setCharacteristic(Characteristic.FirmwareRevision, pkginfo.version)
      .setCharacteristic(Characteristic.HardwareRevision, pkginfo.version);
  }

  getServices() {
    return [
      this.switchService,
      this.accessoryInformationService,
      ...this.sceneSwitches,
    ];
  }

  setScene(scene, on, callback, switchService) {
    if (on) {
      let sceneToApply = scene;
      if (!scene) {
        sceneToApply = this.pickRandomScene();
      }

      this.log(`Applying scene "${sceneToApply.name}"`);

      this
        .applyScene(sceneToApply, this.zones)
        .then(() => {
          // Turn off the switch after one second
          setTimeout(() => {
            switchService
              .setCharacteristic(Characteristic.On, false);
          }, 1000);

          callback();
        });
    } else {
      callback();
    }
  }

  loadScenes(path) {
    const jsonFile = fs.readFileSync(`${storagePath}/${path}`, 'utf8');
    const config = JSON.parse(jsonFile);

    this.scenes = config.scenes;
    this.zones = config.zones;

    debug(`Loaded ${this.scenes.length} scenes - ${this.zones.length} zones`);
  }

  pickRandomScene() {
    const { scenes } = this;

    return scenes[Math.floor(Math.random() * scenes.length)];
  }

  async applyScene(scene, zones) {
    await applyScene(this.hueApi, scene, zones, this.log);
    return true;
  }
}

module.exports = (homebridge) => {
  Service = homebridge.hap.Service; // eslint-disable-line
  Characteristic = homebridge.hap.Characteristic; // eslint-disable-line
  UUIDGen = homebridge.hap.uuid; // eslint-disable-line
  storagePath = homebridge.user.storagePath(); // eslint-disable-line

  homebridge.registerAccessory('homebridge-hue-scenes', 'HueScenes', HueScenes);
};

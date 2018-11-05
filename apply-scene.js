const Bottleneck = require("bottleneck");

/*
 * From https://developers.meethue.com/things-you-need-know
 *
 * Number of commands you can send per second
 *
 * You can send commands to the lights too fast. If you stay roughly around 10 commands per second to the /lights
 * resource as maximum you should be fine. For /groups commands you should keep to a maximum of 1 per second.
 *
 *
 * From https://developers.meethue.com/documentation/hue-system-performance
 *
 * As a general guideline we always recommend to our developers to stay at roughly 10 commands per second to the /lights
 * resource with a 100ms gap between each API call. For /groups commands you should keep to a maximum of 1 per second.
 * It is however always recommended to take into consideration the above information and to of course stress test your
 * app/system to find the optimal values for your application.
 */
const limiter = new Bottleneck({
  reservoir: 10, // initial value
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 1000 // must be divisible by 250
});

const applySettingsToZone = (hueApi, settings, zone) => {
  zone.forEach(async (lamp) => {
    const { hueLightId } = lamp;

    const wrapped = limiter.wrap(hueApi.setLightState.bind(hueApi));
    wrapped(hueLightId, settings);
  });
};

module.exports = async (hueApi, sceneData, zones, logger) => {
  sceneData.forEach((scene) => {
    const { settings, applyTo } = scene;

    applyTo.forEach(async (zone) => {
      if (!zones[zone]) {
        logger(`Error: zone "${zone}" not found`);
        return;
      }
      applySettingsToZone(hueApi, settings, zones[zone]);
    });
  });
};

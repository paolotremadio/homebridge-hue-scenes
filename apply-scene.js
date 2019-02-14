const Bottleneck = require("bottleneck");
const debug = require('debug')('homebridge-hue-sceness');

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

let consoleLogger = () => true;

limiter.on('failed', async (error, jobInfo) => {
  const id = jobInfo.options.id;
  debug(`Job ${id} failed: ${error}`);

  if (jobInfo.retryCount === 0) { // Retry, only once
    debug(`Retrying job ${id} in 1000ms!`);
    consoleLogger(`Error in setting the light "${id}" - Retrying in 1000ms -- ${error}`);
    return 1000;
  } else {
    consoleLogger(`Error in setting "${id}" - Not retrying again -- ${error}`);
  }
});


const applySettingsToZone = (hueApi, settings, zone, sceneName) => {
  zone.forEach((lamp) => {
    const { hueLightId } = lamp;
    const jobId = `${sceneName} // Light ${hueLightId}`;

    limiter.schedule({ id: jobId }, async () => {
      debug(`[${jobId}] Running promise to set the light state`);
      try {
        await hueApi.setLightState(hueLightId, settings);
        debug(`[${jobId}] Light state set`);
        return true;
      } catch (e) {
        debug(`[${jobId}] Error in promise: ${e}`);
        throw e;
      }
    });
  });
};

module.exports = async (hueApi, scene, zones, logger) => {
  const sceneName = scene.name;
  const sceneData = scene.data;

  debug(`Applying scene ${sceneName}...`);

  consoleLogger = logger;
  sceneData.forEach((scene) => {
    const { settings, applyTo } = scene;

    applyTo.forEach((zone) => {
      if (!zones[zone]) {
        logger(`Error: zone "${zone}" not found`);
        return;
      }
      applySettingsToZone(hueApi, settings, zones[zone], sceneName);
    });
  });
};

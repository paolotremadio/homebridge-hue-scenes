const Bottleneck = require('bottleneck');
const debug = require('debug')('homebridge-hue-scenes');

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

let consoleLogger = () => true;

let limiter;
const limiterSettings = {
  reservoir: 10, // initial value
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 1000, // must be divisible by 250
};

const getNewLimiter = async () => {
  if (limiter) {
    debug('Dropping old limiter and jobs');
    await limiter.stop({ dropWaitingJobs: true });
  }

  limiter = new Bottleneck(limiterSettings);

  limiter.on('failed', async (error, jobInfo) => {
    const { id } = jobInfo.options;
    debug(`Job ${id} failed: ${error}`);

    if (jobInfo.retryCount === 0) { // Retry, only once
      debug(`Retrying job ${id} in 1000ms!`);
      consoleLogger(`Error in setting the light "${id}" - Retrying in 1000ms -- ${error}`);
      return 1000;
    }
    consoleLogger(`Error in setting "${id}" - Not retrying again -- ${error}`);
  });
};


const applySettingsToZone = async (hueApi, settings, zone, sceneName) => {
  zone.forEach((lamp) => {
    const { hueLightId } = lamp;
    const jobId = `${sceneName} // Light ${hueLightId}`;

    limiter.schedule({ id: jobId }, async () => {
      debug(`[${jobId}] Running promise to set the light state`);
      try {
        await hueApi.put(`/lights/${hueLightId}/state`, settings);
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
  await getNewLimiter();

  consoleLogger = logger;
  sceneData.forEach((sceneDetails) => {
    const { settings, applyTo } = sceneDetails;

    // Note: forEach does not support async, it will not actually wait
    applyTo.forEach(async (zone) => {
      if (!zones[zone]) {
        logger(`Error: zone "${zone}" not found`);
        return;
      }
      await applySettingsToZone(hueApi, settings, zones[zone], sceneName);
    });
  });
};

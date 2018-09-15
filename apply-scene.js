const applySettingsToZone = async (hueApi, settings, zone) => {
  zone.forEach(async (lamp) => {
    const { hueLightId } = lamp;

    await hueApi.setLightState(hueLightId, settings);
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
      await applySettingsToZone(hueApi, settings, zones[zone]);
    });
  });
};

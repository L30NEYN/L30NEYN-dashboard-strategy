/**
 * HA Custom Dashboard Strategy - Statistics View
 * 
 * Generates dedicated statistics dashboard with energy, climate, and system health.
 * 
 * @version 1.1.0
 */

window.HaCustomStatisticsView = {
  /**
   * Generate statistics view
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Entity/device/area registry
   * @returns {Object} View config
   */
  generate(hass, config, registry) {
    const { entities, devices, areas } = registry;
    const collectors = window.HaCustomStatisticsCollectors;
    const builders = window.HaCustomStatisticsCardBuilders;

    const cards = [];

    // Header
    cards.push({
      type: 'markdown',
      content: '# Statistiken\n\nÜberblick über Energie, Klima und System.',
    });

    // Energy statistics
    if (config.show_energy_stats !== false) {
      const energyStats = collectors.collectEnergy(hass, entities, config);
      const energyCard = builders.buildEnergyCard(energyStats);
      if (energyCard) {
        cards.push(energyCard);
      }
    }

    // Climate statistics
    if (config.show_climate_stats !== false) {
      const climateStats = collectors.collectClimate(hass, entities, areas, config);
      const climateCard = builders.buildClimateCard(climateStats);
      if (climateCard) {
        cards.push(climateCard);
      }
    }

    // System health
    if (config.show_system_health !== false) {
      const systemStats = collectors.collectSystemHealth(hass, entities, config);
      const systemCard = builders.buildSystemHealthCard(systemStats);
      if (systemCard) {
        cards.push(systemCard);
      }
    }

    // Network statistics
    if (config.show_network_stats === true) {
      const networkStats = collectors.collectNetwork(hass, entities, config);
      const networkCard = builders.buildNetworkCard(networkStats);
      if (networkCard) {
        cards.push(networkCard);
      }
    }

    // No statistics available
    if (cards.length === 1) {
      cards.push({
        type: 'markdown',
        content: 'Keine Statistiken verfügbar. Konfiguriere Energie-, Klima- oder System-Sensoren.',
      });
    }

    return {
      title: 'Statistiken',
      path: 'statistics',
      icon: 'mdi:chart-box',
      cards: cards,
    };
  },
};

console.info('[Statistics View] Module loaded');

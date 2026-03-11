/**
 * HA Custom Dashboard Strategy - Statistics Card Builders
 * 
 * Creates statistics cards for energy, climate, and system health.
 * 
 * @version 1.1.0
 */

window.HaCustomStatisticsCardBuilders = {
  /**
   * Build energy statistics card
   * @param {Object} stats - Energy statistics
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildEnergyCard(stats, options = {}) {
    const entities = [
      {
        type: 'custom:mushroom-chips-card',
        chips: [
          {
            type: 'template',
            icon: 'mdi:lightning-bolt',
            content: `${stats.totalConsumption} kWh`,
            icon_color: 'orange',
          },
          {
            type: 'template',
            icon: 'mdi:solar-power',
            content: `${stats.totalProduction} kWh`,
            icon_color: 'green',
          },
          {
            type: 'template',
            icon: 'mdi:transmission-tower',
            content: `${stats.netConsumption} kWh`,
            icon_color: stats.netConsumption > 0 ? 'red' : 'blue',
          },
        ],
      },
    ];

    // Add top consumers
    if (stats.consumers.length > 0) {
      entities.push({
        type: 'section',
        label: 'Top Verbraucher',
      });

      stats.consumers.forEach(consumer => {
        entities.push({
          entity: consumer.entity_id,
          secondary_info: `${consumer.value.toFixed(2)} ${consumer.unit}`,
        });
      });
    }

    return {
      type: 'entities',
      title: 'Energieübersicht',
      icon: 'mdi:lightning-bolt',
      entities: entities,
      ...options,
    };
  },

  /**
   * Build climate statistics card
   * @param {Object} stats - Climate statistics
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildClimateCard(stats, options = {}) {
    const entities = [];

    // Add summary
    entities.push({
      type: 'custom:mushroom-chips-card',
      chips: [
        {
          type: 'template',
          icon: 'mdi:thermometer',
          content: `⌀ ${stats.avgTemperature}°C`,
          icon_color: this.getTemperatureColor(parseFloat(stats.avgTemperature)),
        },
        {
          type: 'template',
          icon: 'mdi:water-percent',
          content: `⌀ ${stats.avgHumidity}%`,
          icon_color: this.getHumidityColor(parseFloat(stats.avgHumidity)),
        },
      ],
    });

    // Add temperature range
    if (stats.minTemperature !== 'N/A' && stats.maxTemperature !== 'N/A') {
      entities.push({
        type: 'attribute',
        entity: 'sun.sun',
        attribute: 'elevation',
        name: 'Temperaturbereich',
        format: 'total',
        suffix: ` ${stats.minTemperature}°C - ${stats.maxTemperature}°C`,
      });
    }

    // Add room breakdown
    if (stats.roomTemps.length > 0) {
      entities.push({
        type: 'section',
        label: 'Räume',
      });

      stats.roomTemps.slice(0, 5).forEach(room => {
        entities.push({
          type: 'custom:mushroom-entity-card',
          name: room.area,
          icon: 'mdi:home-thermometer',
          primary_info: 'name',
          secondary_info: `${room.value.toFixed(1)}${room.unit}`,
        });
      });
    }

    return {
      type: 'entities',
      title: 'Klimaübersicht',
      icon: 'mdi:home-thermometer-outline',
      entities: entities,
      ...options,
    };
  },

  /**
   * Build system health card
   * @param {Object} stats - System health statistics
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildSystemHealthCard(stats, options = {}) {
    const entities = [];

    // Health percentage
    entities.push({
      type: 'custom:mushroom-template-card',
      primary: 'Systemgesundheit',
      secondary: `${stats.healthPercentage}% verfügbar`,
      icon: 'mdi:heart-pulse',
      icon_color: stats.healthPercentage > 95 ? 'green' : stats.healthPercentage > 85 ? 'orange' : 'red',
      layout: 'horizontal',
    });

    // Statistics
    entities.push({
      type: 'section',
      label: 'Statistiken',
    });

    entities.push({
      type: 'attribute',
      entity: 'sun.sun',
      attribute: 'elevation',
      name: 'Entitäten',
      format: 'total',
      suffix: ` ${stats.totalEntities}`,
      icon: 'mdi:label',
    });

    entities.push({
      type: 'attribute',
      entity: 'sun.sun',
      attribute: 'elevation',
      name: 'Geräte',
      format: 'total',
      suffix: ` ${stats.totalDevices}`,
      icon: 'mdi:devices',
    });

    if (stats.unavailableCount > 0) {
      entities.push({
        type: 'attribute',
        entity: 'sun.sun',
        attribute: 'elevation',
        name: 'Nicht verfügbar',
        format: 'total',
        suffix: ` ${stats.unavailableCount}`,
        icon: 'mdi:alert-circle',
      });
    }

    // Automations
    entities.push({
      type: 'section',
      label: 'Automatisierungen',
    });

    entities.push({
      type: 'attribute',
      entity: 'sun.sun',
      attribute: 'elevation',
      name: 'Aktiv',
      format: 'total',
      suffix: ` ${stats.automations.active} / ${stats.automations.total}`,
      icon: 'mdi:robot',
    });

    // Updates
    if (stats.updatesAvailable > 0) {
      entities.push({
        type: 'section',
        label: `Updates verfügbar (${stats.updatesAvailable})`,
      });

      stats.updateEntities.slice(0, 3).forEach(update => {
        entities.push({
          entity: update.entity_id,
          secondary_info: update.version,
        });
      });
    }

    return {
      type: 'entities',
      title: 'Systemstatus',
      icon: 'mdi:server',
      entities: entities,
      ...options,
    };
  },

  /**
   * Build network statistics card
   * @param {Object} stats - Network statistics
   * @param {Object} options - Card options
   * @returns {Object|null} Card config or null if no data
   */
  buildNetworkCard(stats, options = {}) {
    if (!stats.download && !stats.upload && !stats.ping) {
      return null;
    }

    const chips = [];

    if (stats.download) {
      chips.push({
        type: 'template',
        icon: 'mdi:download',
        content: `${stats.download.value.toFixed(1)} ${stats.download.unit}`,
        icon_color: 'blue',
      });
    }

    if (stats.upload) {
      chips.push({
        type: 'template',
        icon: 'mdi:upload',
        content: `${stats.upload.value.toFixed(1)} ${stats.upload.unit}`,
        icon_color: 'green',
      });
    }

    if (stats.ping) {
      chips.push({
        type: 'template',
        icon: 'mdi:swap-horizontal',
        content: `${stats.ping.value.toFixed(0)} ${stats.ping.unit}`,
        icon_color: stats.ping.value < 50 ? 'green' : 'orange',
      });
    }

    return {
      type: 'custom:mushroom-chips-card',
      chips: chips,
      ...options,
    };
  },

  /**
   * Build combined statistics dashboard card
   * @param {Object} allStats - All statistics
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildCombinedStatsCard(allStats, options = {}) {
    return {
      type: 'vertical-stack',
      cards: [
        this.buildEnergyCard(allStats.energy),
        this.buildClimateCard(allStats.climate),
        this.buildSystemHealthCard(allStats.systemHealth),
      ].filter(card => card !== null),
      ...options,
    };
  },

  /**
   * Get temperature color based on value
   * @param {number} temp - Temperature value
   * @returns {string} Color name
   */
  getTemperatureColor(temp) {
    if (temp < 18) return 'blue';
    if (temp < 22) return 'green';
    if (temp < 25) return 'orange';
    return 'red';
  },

  /**
   * Get humidity color based on value
   * @param {number} humidity - Humidity value
   * @returns {string} Color name
   */
  getHumidityColor(humidity) {
    if (humidity < 30) return 'orange';
    if (humidity < 60) return 'green';
    if (humidity < 70) return 'orange';
    return 'red';
  },
};

console.info('[Statistics Card Builders] Module loaded');

/**
 * HA Custom Dashboard Strategy - Overview View
 * 
 * Generates the main overview/home view.
 * Shows summary of all areas, weather, security, and system status.
 * 
 * @version 1.0.0
 */

window.HaCustomOverviewView = {
  /**
   * Generate overview view
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Entity/device/area registry
   * @returns {Object} View config
   */
  generate(hass, config, registry) {
    const { entities, devices, areas } = registry;
    const collectors = window.HaCustomDataCollectors;
    const builders = window.HaCustomCardBuilders;

    const cards = [];

    // Welcome card
    if (config.show_welcome !== false) {
      cards.push({
        type: 'markdown',
        content: `# Willkommen\n\n${this.getGreeting()}`,
      });
    }

    // Weather card
    const weatherEntity = config.weather_entity || this.findWeatherEntity(hass);
    if (weatherEntity) {
      cards.push(builders.buildWeatherCard(weatherEntity));
    }

    // Area cards
    if (config.show_areas !== false) {
      const areaCards = this.buildAreaCards(areas, hass, entities, devices, config);
      if (areaCards.length > 0) {
        cards.push({
          type: 'grid',
          cards: areaCards,
          columns: 3,
        });
      }
    }

    // Security card
    if (config.show_security !== false) {
      const securityData = collectors.collectSecurity(hass, entities, config);
      if (
        securityData.locks.length > 0 ||
        securityData.doors.length > 0 ||
        securityData.windows.length > 0 ||
        securityData.alarm
      ) {
        cards.push(builders.buildSecurityCard(securityData));
      }
    }

    // Light summary
    if (config.show_light_summary !== false) {
      const lights = collectors.collectLights(hass, entities, config);
      cards.push({
        type: 'entities',
        title: 'Beleuchtung',
        entities: [
          {
            type: 'attribute',
            entity: 'sun.sun',
            attribute: 'next_rising',
            name: 'Lichter an',
            format: 'total',
            suffix: ` (${lights.on.length})`,
          },
          {
            type: 'attribute',
            entity: 'sun.sun',
            attribute: 'next_setting',
            name: 'Lichter aus',
            format: 'total',
            suffix: ` (${lights.off.length})`,
          },
        ],
      });
    }

    // Battery status
    if (config.show_battery_status !== false) {
      const batteries = collectors.collectBatteries(hass, entities, config);
      if (batteries.critical.length > 0 || batteries.low.length > 0) {
        cards.push(builders.buildBatteryCard(batteries.critical, batteries.low));
      }
    }

    return {
      title: config.title || 'Übersicht',
      path: 'overview',
      icon: config.icon || 'mdi:home',
      cards: cards,
    };
  },

  /**
   * Build area summary cards
   * @param {Array} areas - Area registry
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Array} devices - Device registry
   * @param {Object} config - Strategy config
   * @returns {Array} Area cards
   */
  buildAreaCards(areas, hass, entities, devices, config) {
    const helpers = window.HaCustomHelpers;
    const builders = window.HaCustomCardBuilders;
    const deviceAreaMap = helpers.buildDeviceAreaMap(devices);

    return areas
      .filter(area => {
        // Hide areas with no_dboard label
        return !area.labels || !area.labels.includes('no_dboard');
      })
      .map(area => {
        // Get entities in this area
        let areaEntities = helpers.filterByArea(entities, area.area_id, deviceAreaMap);
        areaEntities = helpers.filterByLabels(areaEntities);
        areaEntities = helpers.filterAvailable(areaEntities);

        // Count by domain
        const lights = areaEntities.filter(e => e.entity_id.startsWith('light.'));
        const covers = areaEntities.filter(e => e.entity_id.startsWith('cover.'));

        return {
          type: 'button',
          name: area.name,
          icon: area.icon || 'mdi:home',
          tap_action: {
            action: 'navigate',
            navigation_path: `/dashboard-custom/${area.area_id}`,
          },
          entity: lights[0]?.entity_id, // Show first light as indicator
        };
      });
  },

  /**
   * Find weather entity
   * @param {Object} hass - Home Assistant object
   * @returns {string|null} Weather entity ID
   */
  findWeatherEntity(hass) {
    const weatherEntities = Object.keys(hass.states).filter(id => id.startsWith('weather.'));
    return weatherEntities[0] || null;
  },

  /**
   * Get time-based greeting
   * @returns {string} Greeting message
   */
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return 'Gute Nacht';
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  },
};

console.info('[Overview View] Module loaded');

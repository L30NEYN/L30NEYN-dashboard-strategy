/**
 * HA Custom Dashboard Strategy - Card Builders
 * 
 * Creates Lovelace card configurations.
 * Handles different card types and options.
 * 
 * @version 1.1.0
 */

window.HaCustomCardBuilders = {
  /**
   * Build entity card
   * @param {string|Array} entity - Entity ID or array of entity IDs
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildEntityCard(entity, options = {}) {
    const config = {
      type: 'entity',
      ...options,
    };

    if (Array.isArray(entity)) {
      config.entity = entity[0];
    } else {
      config.entity = entity;
    }

    return config;
  },

  /**
   * Build entities card
   * @param {Array} entities - Entity IDs or configs
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildEntitiesCard(entities, options = {}) {
    return {
      type: 'entities',
      entities: entities,
      ...options,
    };
  },

  /**
   * Build light card
   * @param {string|Array} entity - Entity ID or array of entity IDs
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildLightCard(entity, options = {}) {
    const config = {
      type: 'light',
      ...options,
    };

    if (Array.isArray(entity)) {
      config.entity = entity[0];
    } else {
      config.entity = entity;
    }

    return config;
  },

  /**
   * Build group control card
   * Provides buttons to control multiple entities at once
   * @param {Array} entities - Entity IDs
   * @param {string} domain - Entity domain (light, cover, etc.)
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildGroupControlCard(entities, domain, options = {}) {
    const config = {
      type: 'entities',
      title: options.title || 'Gruppensteuerung',
      entities: [],
      ...options,
    };

    // Add group control entity if available
    if (domain === 'light') {
      config.entities.push({
        type: 'button',
        name: 'Alle Lichter an',
        icon: 'mdi:lightbulb-on',
        tap_action: {
          action: 'call-service',
          service: 'light.turn_on',
          data: {
            entity_id: entities,
          },
        },
      });
      config.entities.push({
        type: 'button',
        name: 'Alle Lichter aus',
        icon: 'mdi:lightbulb-off',
        tap_action: {
          action: 'call-service',
          service: 'light.turn_off',
          data: {
            entity_id: entities,
          },
        },
      });
    } else if (domain === 'cover') {
      config.entities.push({
        type: 'button',
        name: 'Alle öffnen',
        icon: 'mdi:arrow-up',
        tap_action: {
          action: 'call-service',
          service: 'cover.open_cover',
          data: {
            entity_id: entities,
          },
        },
      });
      config.entities.push({
        type: 'button',
        name: 'Alle schließen',
        icon: 'mdi:arrow-down',
        tap_action: {
          action: 'call-service',
          service: 'cover.close_cover',
          data: {
            entity_id: entities,
          },
        },
      });
    }

    return config;
  },

  /**
   * Build sensor card
   * @param {Array} entities - Entity IDs
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildSensorCard(entities, options = {}) {
    return {
      type: 'entities',
      entities: entities,
      ...options,
    };
  },

  /**
   * Build weather card
   * @param {string} entity - Weather entity ID
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildWeatherCard(entity, options = {}) {
    return {
      type: 'weather-forecast',
      entity: entity,
      show_forecast: true,
      ...options,
    };
  },

  /**
   * Build area card
   * @param {string} area - Area name
   * @param {Object} stats - Area statistics
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildAreaCard(area, stats, options = {}) {
    return {
      type: 'button',
      name: area,
      tap_action: {
        action: 'navigate',
        navigation_path: `/dashboard-custom/${area.toLowerCase().replace(/\s+/g, '-')}`,
      },
      ...options,
    };
  },

  /**
   * Build battery status card
   * @param {Array} critical - Critical battery entities
   * @param {Array} low - Low battery entities
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildBatteryCard(critical, low, options = {}) {
    const entities = [];

    if (critical.length > 0) {
      entities.push({
        type: 'section',
        label: 'Kritisch (<20%)',
      });
      entities.push(...critical);
    }

    if (low.length > 0) {
      entities.push({
        type: 'section',
        label: 'Niedrig (<50%)',
      });
      entities.push(...low);
    }

    if (entities.length === 0) {
      entities.push({
        type: 'label',
        label: 'Alle Batterien in Ordnung ✓',
      });
    }

    return {
      type: 'entities',
      title: 'Batteriestatus',
      entities: entities,
      ...options,
    };
  },

  /**
   * Build security card
   * @param {Object} data - Security data
   * @param {Object} options - Card options
   * @returns {Object} Card config
   */
  buildSecurityCard(data, options = {}) {
    const entities = [];

    if (data.alarm) {
      entities.push(data.alarm);
    }

    if (data.locks.length > 0) {
      entities.push({
        type: 'section',
        label: 'Schlösser',
      });
      entities.push(...data.locks);
    }

    if (data.doors.length > 0) {
      entities.push({
        type: 'section',
        label: 'Türen',
      });
      entities.push(...data.doors);
    }

    if (data.windows.length > 0) {
      entities.push({
        type: 'section',
        label: 'Fenster',
      });
      entities.push(...data.windows);
    }

    return {
      type: 'entities',
      title: 'Sicherheit',
      entities: entities,
      ...options,
    };
  },
};

console.info('[Card Builders] Module loaded');

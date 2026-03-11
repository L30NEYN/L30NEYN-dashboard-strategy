/**
 * HA Custom Dashboard Strategy - Room View
 * 
 * Generates individual room views with grouped entity controls.
 * Supports lights, covers, sensors, climate, media, and more.
 * 
 * @version 1.0.0
 */

window.HaCustomRoomView = {
  // Domain display order
  DOMAIN_ORDER: [
    'light',
    'cover',
    'climate',
    'fan',
    'switch',
    'media_player',
    'sensor',
    'binary_sensor',
    'camera',
  ],

  // Domain title map
  DOMAIN_TITLES: {
    light: 'Beleuchtung',
    cover: 'Rollos & Vorhänge',
    climate: 'Klima',
    fan: 'Ventilatoren',
    switch: 'Schalter',
    media_player: 'Medien',
    sensor: 'Sensoren',
    binary_sensor: 'Status',
    camera: 'Kameras',
  },

  /**
   * Generate room view
   * @param {string} areaId - Area ID
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Entity/device/area registry
   * @returns {Object} View config
   */
  generate(areaId, hass, config, registry) {
    const { entities, devices, areas } = registry;
    const area = areas.find(a => a.area_id === areaId);

    if (!area) {
      return {
        title: 'Fehler',
        path: areaId,
        cards: [
          {
            type: 'markdown',
            content: 'Raum nicht gefunden.',
          },
        ],
      };
    }

    const collectors = window.HaCustomDataCollectors;
    const builders = window.HaCustomCardBuilders;

    // Collect room entities grouped by domain
    const roomEntities = collectors.collectRoomEntities(areaId, hass, entities, devices, config);

    const cards = [];

    // Add group control cards for controllable domains
    if (roomEntities.light && roomEntities.light.length > 1) {
      cards.push(builders.buildGroupControlCard(roomEntities.light, 'light'));
    }

    if (roomEntities.cover && roomEntities.cover.length > 1) {
      cards.push(builders.buildGroupControlCard(roomEntities.cover, 'cover'));
    }

    // Build domain cards in order
    for (const domain of this.DOMAIN_ORDER) {
      if (!roomEntities[domain] || roomEntities[domain].length === 0) continue;

      const card = this.buildDomainCard(domain, roomEntities[domain], hass, config);
      if (card) {
        cards.push(card);
      }
    }

    // Add remaining domains not in order
    for (const domain in roomEntities) {
      if (this.DOMAIN_ORDER.includes(domain)) continue;

      const card = this.buildDomainCard(domain, roomEntities[domain], hass, config);
      if (card) {
        cards.push(card);
      }
    }

    return {
      title: area.name,
      path: areaId,
      icon: area.icon || 'mdi:home',
      cards: cards.length > 0 ? cards : [{
        type: 'markdown',
        content: 'Keine Geräte in diesem Raum.',
      }],
    };
  },

  /**
   * Build card for domain entities
   * @param {string} domain - Entity domain
   * @param {Array} entityIds - Entity IDs
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @returns {Object|null} Card config
   */
  buildDomainCard(domain, entityIds, hass, config) {
    const builders = window.HaCustomCardBuilders;
    const title = this.DOMAIN_TITLES[domain] || domain.replace('_', ' ');

    switch (domain) {
      case 'light':
        return builders.buildEntitiesCard(entityIds, { title });

      case 'cover':
        return builders.buildEntitiesCard(entityIds, { title });

      case 'climate':
        return builders.buildEntitiesCard(entityIds, { title });

      case 'sensor':
      case 'binary_sensor':
        // Filter to relevant sensors
        const relevantSensors = entityIds.filter(id => {
          const state = hass.states[id];
          if (!state) return false;

          const deviceClass = state.attributes.device_class;
          return [
            'temperature',
            'humidity',
            'illuminance',
            'motion',
            'occupancy',
            'door',
            'window',
          ].includes(deviceClass);
        });

        if (relevantSensors.length === 0) return null;

        return builders.buildSensorCard(relevantSensors, { title });

      default:
        return builders.buildEntitiesCard(entityIds, { title });
    }
  },
};

console.info('[Room View] Module loaded');

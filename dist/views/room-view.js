/**
 * L30NEYN Dashboard Strategy - Room View v2.2.0
 * 
 * Generates individual room views with integrated group controls.
 * Features:
 * - Light group controls (All On / All Off)
 * - Cover group controls (All Open / All Close)
 * - Organized by domain with proper titles
 * - Dynamic control display based on device count
 * 
 * @version 2.2.0
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

    // Room header
    cards.push({
      type: 'markdown',
      content: `# ${area.name}\n🎪 Räumliche Steuerung`,
    });

    // ========== GROUP CONTROL CARDS ==========
    const controlCards = [];

    // Light controls (show if 2+ lights)
    if (roomEntities.light && roomEntities.light.length > 1) {
      const lightControl = this.buildGroupControlCard(
        roomEntities.light,
        'light',
        { title: '💱 Lichter' }
      );
      controlCards.push(lightControl);
    }

    // Cover controls (show if 2+ covers)
    if (roomEntities.cover && roomEntities.cover.length > 1) {
      const coverControl = this.buildGroupControlCard(
        roomEntities.cover,
        'cover',
        { title: '👁 Rollos & Vorhänge' }
      );
      controlCards.push(coverControl);
    }

    // Add control cards in a grid if they exist
    if (controlCards.length > 0) {
      cards.push({
        type: 'grid',
        cards: controlCards,
        columns: Math.min(2, controlCards.length),
      });
    }

    // ========== DOMAIN CARDS ==========

    // Build domain cards in order
    for (const domain of this.DOMAIN_ORDER) {
      if (!roomEntities[domain] || roomEntities[domain].length === 0) continue;

      const card = this.buildDomainCard(domain, roomEntities[domain], hass, config);
      if (card) {
        cards.push(card);
      }
    }

    // Add remaining domains not in predefined order
    for (const domain in roomEntities) {
      if (this.DOMAIN_ORDER.includes(domain)) continue;
      if (!roomEntities[domain] || roomEntities[domain].length === 0) continue;

      const card = this.buildDomainCard(domain, roomEntities[domain], hass, config);
      if (card) {
        cards.push(card);
      }
    }

    return {
      title: area.name,
      path: areaId,
      icon: area.icon || 'mdi:home',
      cards: cards.length > 1 ? cards : [{
        type: 'markdown',
        content: 'Keine Geräte in diesem Raum.',
      }],
    };
  },

  /**
   * Build group control card for domain
   * @param {Array} entityIds - Entity IDs
   * @param {string} domain - Entity domain (light, cover, etc.)
   * @param {Object} options - Card options
   * @returns {Object} Control card config
   */
  buildGroupControlCard(entityIds, domain, options = {}) {
    const config = {
      type: 'entities',
      entities: [],
      ...options,
    };

    if (domain === 'light') {
      config.entities.push({
        type: 'button',
        name: '💡 Alle an',
        icon: 'mdi:lightbulb-on',
        tap_action: {
          action: 'call-service',
          service: 'light.turn_on',
          data: {
            entity_id: entityIds,
          },
        },
      });
      config.entities.push({
        type: 'button',
        name: '💥 Alle aus',
        icon: 'mdi:lightbulb-off',
        tap_action: {
          action: 'call-service',
          service: 'light.turn_off',
          data: {
            entity_id: entityIds,
          },
        },
      });
    } else if (domain === 'cover') {
      config.entities.push({
        type: 'button',
        name: '⬆️ Alle öffnen',
        icon: 'mdi:arrow-up',
        tap_action: {
          action: 'call-service',
          service: 'cover.open_cover',
          data: {
            entity_id: entityIds,
          },
        },
      });
      config.entities.push({
        type: 'button',
        name: '⬇️ Alle schließen',
        icon: 'mdi:arrow-down',
        tap_action: {
          action: 'call-service',
          service: 'cover.close_cover',
          data: {
            entity_id: entityIds,
          },
        },
      });
    }

    return config;
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

console.info('[L30NEYN Room View] Module loaded - v2.2.0');

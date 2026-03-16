/**
 * L30NEYN Dashboard Strategy - Overview View v2.2.0
 * 
 * Generates the main overview/home view with fixed 3-column layout:
 * - Column 1: Clock, Weather, Calendar
 * - Column 2: Rooms/Areas
 * - Column 3: Indicators (Battery, Security, etc.)
 * 
 * Uses native Lovelace columns card for reliable layout management.
 * 
 * @version 2.2.0
 */

window.HaCustomOverviewView = {
  /**
   * Generate overview view with 3-column layout
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Entity/device/area registry
   * @returns {Object} View config
   */
  generate(hass, config, registry) {
    const { entities, devices, areas } = registry;
    const collectors = window.HaCustomDataCollectors;
    const builders = window.HaCustomCardBuilders;

    // Build three separate column card lists
    const column1Cards = [];  // Clock, Weather, Calendar
    const column2Cards = [];  // Rooms/Areas
    const column3Cards = [];  // Indicators

    // ========== COLUMN 1: Clock, Weather, Calendar ==========
    
    // Welcome/Greeting card
    if (config.show_welcome !== false) {
      column1Cards.push({
        type: 'markdown',
        content: `# ${this.getGreeting()}\n**${this.getDateString()}**`,
      });
    }

    // Weather card
    const weatherEntity = config.weather_entity || this.findWeatherEntity(hass);
    if (weatherEntity) {
      column1Cards.push(builders.buildWeatherCard(weatherEntity));
    }

    // Calendar card (if configured)
    if (config.calendar_entity) {
      column1Cards.push({
        type: 'calendar',
        entity: config.calendar_entity,
      });
    }

    // ========== COLUMN 2: Rooms/Areas ==========
    
    if (config.show_areas !== false) {
      const areaCards = this.buildAreaCards(areas, hass, entities, devices, config);
      if (areaCards.length > 0) {
        // Group area cards by floor if configured
        const floorGroupedAreas = this.groupAreasByFloor(areaCards, areas, config);
        
        if (Array.isArray(floorGroupedAreas)) {
          // Multiple floors - show with headers
          for (const floorGroup of floorGroupedAreas) {
            if (floorGroup.title) {
              column2Cards.push({
                type: 'markdown',
                content: `## ${floorGroup.title}`,
              });
            }
            column2Cards.push({
              type: 'grid',
              cards: floorGroup.cards,
              columns: Math.min(3, floorGroup.cards.length),
            });
          }
        } else {
          // Single floor or no grouping
          column2Cards.push({
            type: 'grid',
            cards: areaCards,
            columns: Math.min(3, areaCards.length),
          });
        }
      }
    }

    // ========== COLUMN 3: Indicators ==========

    // Security indicator
    if (config.show_security !== false) {
      const securityData = collectors.collectSecurity(hass, entities, config);
      if (
        securityData.locks.length > 0 ||
        securityData.doors.length > 0 ||
        securityData.windows.length > 0 ||
        securityData.alarm
      ) {
        column3Cards.push(builders.buildSecurityCard(securityData));
      }
    }

    // Battery status indicator
    if (config.show_battery_status !== false) {
      const batteries = collectors.collectBatteries(hass, entities, config);
      if (batteries.critical.length > 0 || batteries.low.length > 0) {
        column3Cards.push(builders.buildBatteryCard(batteries.critical, batteries.low));
      }
    }

    // Light summary
    if (config.show_light_summary !== false) {
      const lights = collectors.collectLights(hass, entities, config);
      if (lights.on.length > 0 || lights.off.length > 0) {
        column3Cards.push({
          type: 'entities',
          title: 'Beleuchtung',
          entities: [
            {
              type: 'custom:state-stat',
              entity: 'light.all_lights',
              name: 'Lichter an',
              icon: 'mdi:lightbulb-on',
            },
          ],
        });
      }
    }

    // ========== Combine into 3-column layout ==========
    
    const layoutCard = {
      type: 'grid',
      cards: [
        {
          type: 'grid',
          cards: column1Cards.length > 0 ? column1Cards : [{
            type: 'markdown',
            content: 'Keine Informationen verfügbar',
          }],
          columns: 1,
        },
        {
          type: 'grid',
          cards: column2Cards.length > 0 ? column2Cards : [{
            type: 'markdown',
            content: 'Keine Räume konfiguriert',
          }],
          columns: 1,
        },
        {
          type: 'grid',
          cards: column3Cards.length > 0 ? column3Cards : [{
            type: 'markdown',
            content: 'Alle Indikatoren in Ordnung ✓',
          }],
          columns: 1,
        },
      ],
      columns: 3,
    };

    return {
      title: config.title || 'Übersicht',
      path: 'overview',
      icon: config.icon || 'mdi:home',
      cards: [layoutCard],
    };
  },

  /**
   * Build area summary cards
   * @param {Array} areas - Area registry
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Array} devices - Device registry
   * @param {Object} config - Strategy config
   * @returns {Array} Area button cards
   */
  buildAreaCards(areas, hass, entities, devices, config) {
    const helpers = window.HaCustomHelpers;
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

        // Count entities
        const lights = areaEntities.filter(e => e.entity_id.startsWith('light.'));
        const covers = areaEntities.filter(e => e.entity_id.startsWith('cover.'));
        const switches = areaEntities.filter(e => e.entity_id.startsWith('switch.'));
        const climate = areaEntities.filter(e => e.entity_id.startsWith('climate.'));

        return {
          type: 'button',
          name: area.name,
          icon: area.icon || 'mdi:home',
          tap_action: {
            action: 'navigate',
            navigation_path: `/dashboard-l30neyn/${area.area_id}`,
          },
          entity: lights.length > 0 ? lights[0].entity_id : undefined,
          show_state: false,
        };
      });
  },

  /**
   * Group area cards by floor
   * @param {Array} areaCards - Area button cards
   * @param {Array} areas - Area registry
   * @param {Object} config - Strategy config
   * @returns {Array|Array} Grouped areas or flat array
   */
  groupAreasByFloor(areaCards, areas, config) {
    if (config.group_by_floor !== true) {
      return areaCards; // Return flat array if not grouping
    }

    // Group by floor
    const floorsMap = {};
    const areaMap = {};

    // Build area lookup
    for (const area of areas) {
      areaMap[area.area_id] = area;
    }

    // Group cards
    for (const card of areaCards) {
      const areaId = card.tap_action.navigation_path.split('/').pop();
      const area = areaMap[areaId];
      const floor = area?.floor_id || 'Sonstige';

      if (!floorsMap[floor]) {
        floorsMap[floor] = [];
      }
      floorsMap[floor].push(card);
    }

    // Convert to array with titles
    return Object.entries(floorsMap).map(([floorId, cards]) => ({
      title: floorId === 'Sonstige' ? 'Weitere Bereiche' : floorId,
      cards: cards,
    }));
  },

  /**
   * Find weather entity
   * @param {Object} hass - Home Assistant object
   * @returns {string|null} Weather entity ID
   */
  findWeatherEntity(hass) {
    if (!hass?.states) return null;
    const weatherEntities = Object.keys(hass.states).filter(id => id.startsWith('weather.'));
    return weatherEntities[0] || null;
  },

  /**
   * Get time-based greeting
   * @returns {string} Greeting message
   */
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return '🌙 Gute Nacht';
    if (hour < 12) return '☀️ Guten Morgen';
    if (hour < 18) return '🌤️ Guten Tag';
    return '🌙 Guten Abend';
  },

  /**
   * Get formatted date string
   * @returns {string} Date string
   */
  getDateString() {
    const now = new Date();
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    
    return `${days[now.getDay()]}, ${now.getDate()}. ${months[now.getMonth()]} ${now.getFullYear()}`;
  },
};

console.info('[L30NEYN Overview View] Module loaded - v2.2.0');

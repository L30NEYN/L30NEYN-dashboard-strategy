/**
 * L30NEYN Dashboard Strategy - Overview View v2.2.0
 * 
 * Generates the main overview/home view with FIXED column layout:
 * - Column LEFT: Admin, Keller, Warnungen
 * - Column RIGHT: Gästezimmer, Küche, Wohnzimmer, Oben
 * 
 * Uses data-column (left/right) and data-order attributes for
 * reliable layout management and automatic sorting.
 * 
 * @version 2.2.0
 */

window.L30NEYNOverviewView = {
  /**
   * Generate overview view with fixed 2-column layout
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Entity/device/area registry
   * @returns {Object} View config
   */
  generate(hass, config, registry) {
    const { entities, devices, areas } = registry;
    const collectors = window.L30NEYNDataCollectors;
    const builders = window.L30NEYNCardBuilders;

    // Define column structure (LEFT / RIGHT)
    const COLUMN_LAYOUT = {
      left: [],   // Admin, Warnungen, Keller, etc
      right: [], // Gästezimmer, Küche, Wohnzimmer, HWR, Oben
    };

    // ========== WELCOME / GREETING ==========
    const welcomeCard = {
      type: 'markdown',
      content: `# ${this.getGreeting()}\n**${this.getDateString()}**`,
    };
    COLUMN_LAYOUT.left.push({
      card: welcomeCard,
      order: 0,
    });

    // ========== WEATHER ==========
    const weatherEntity = config.weather_entity || this.findWeatherEntity(hass);
    if (weatherEntity) {
      const weatherCard = builders.buildWeatherCard(weatherEntity);
      COLUMN_LAYOUT.left.push({
        card: weatherCard,
        order: 1,
      });
    }

    // ========== CALENDAR ==========
    if (config.calendar_entity) {
      const calendarCard = {
        type: 'calendar',
        entity: config.calendar_entity,
      };
      COLUMN_LAYOUT.left.push({
        card: calendarCard,
        order: 2,
      });
    }

    // ========== ADMIN SECTION ==========
    COLUMN_LAYOUT.left.push({
      card: {
        type: 'markdown',
        content: '## ⚙️ Admin',
      },
      order: 10,
    });

    COLUMN_LAYOUT.left.push({
      card: {
        type: 'entities',
        title: 'Admin',
        entities: ['switch.automations_enabled', 'switch.maintenance_mode'],
      },
      order: 11,
    });

    COLUMN_LAYOUT.left.push({
      card: {
        type: 'entities',
        title: 'Automatisierungen',
        entities: ['automation.morning_routine', 'automation.evening_routine'],
      },
      order: 12,
    });

    // ========== ROOMS / AREAS ==========
    let areaOrder = 20;
    const areasByType = this.groupAreasByLocation(areas, config);

    // Keller
    for (const area of areasByType.basement || []) {
      const areaCard = this.buildAreaCard(area, hass, entities, devices, config);
      COLUMN_LAYOUT.left.push({
        card: areaCard,
        order: areaOrder++,
      });
    }

    // Erdgeschoss
    for (const area of areasByType.ground || []) {
      const areaCard = this.buildAreaCard(area, hass, entities, devices, config);
      COLUMN_LAYOUT.left.push({
        card: areaCard,
        order: areaOrder++,
      });
    }

    // Gästebad (RIGHT)
    if (areasByType.guestroom || []) {
      let guestOrder = 0;
      for (const area of areasByType.guestroom) {
        const areaCard = this.buildAreaCard(area, hass, entities, devices, config);
        COLUMN_LAYOUT.right.push({
          card: areaCard,
          order: guestOrder++,
        });
      }
    }

    // Küche (RIGHT)
    if (areasByType.kitchen || []) {
      let kitchenOrder = 10;
      for (const area of areasByType.kitchen) {
        const areaCard = this.buildAreaCard(area, hass, entities, devices, config);
        COLUMN_LAYOUT.right.push({
          card: areaCard,
          order: kitchenOrder++,
        });
      }
    }

    // Wohnzimmer (RIGHT)
    if (areasByType.livingroom || []) {
      let livingOrder = 20;
      for (const area of areasByType.livingroom) {
        const areaCard = this.buildAreaCard(area, hass, entities, devices, config);
        COLUMN_LAYOUT.right.push({
          card: areaCard,
          order: livingOrder++,
        });
      }
    }

    // Oben (RIGHT)
    if (areasByType.upper || []) {
      let upperOrder = 30;
      for (const area of areasByType.upper) {
        const areaCard = this.buildAreaCard(area, hass, entities, devices, config);
        COLUMN_LAYOUT.right.push({
          card: areaCard,
          order: upperOrder++,
        });
      }
    }

    // ========== WARNINGS / BATTERY ==========
    const batteries = collectors.collectBatteries(hass, entities, config);
    if (batteries.critical.length > 0 || batteries.low.length > 0) {
      const batteryCard = builders.buildBatteryCard(batteries.critical, batteries.low);
      COLUMN_LAYOUT.left.push({
        card: batteryCard,
        order: 100,
      });
    }

    // ========== COMPILE CARDS WITH data-column AND data-order ==========
    const leftCards = COLUMN_LAYOUT.left
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({
        ...item.card,
        'data-column': 'left',
        'data-order': item.order,
      }));

    const rightCards = COLUMN_LAYOUT.right
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({
        ...item.card,
        'data-column': 'right',
        'data-order': item.order,
      }));

    // ========== RETURN VIEW WITH GRID LAYOUT ==========
    return {
      title: config.title || 'Übersicht',
      path: 'overview',
      icon: config.icon || 'mdi:home',
      cards: [
        {
          type: 'grid',
          cards: [...leftCards, ...rightCards],
          columns: 2,
        },
      ],
    };
  },

  /**
   * Group areas by location type
   * @param {Array} areas - Area registry
   * @param {Object} config - Strategy config
   * @returns {Object} Grouped areas by type
   */
  groupAreasByLocation(areas, config) {
    const grouped = {
      basement: [],
      ground: [],
      guestroom: [],
      kitchen: [],
      livingroom: [],
      upper: [],
      other: [],
    };

    for (const area of areas) {
      // Skip areas with no_dboard label
      if (area.labels && area.labels.includes('no_dboard')) {
        continue;
      }

      const id = area.area_id.toLowerCase();
      const name = area.name.toLowerCase();

      if (id.includes('keller') || name.includes('keller')) {
        grouped.basement.push(area);
      } else if (id.includes('gast') || name.includes('gast')) {
        grouped.guestroom.push(area);
      } else if (id.includes('kuche') || id.includes('küche') || name.includes('küche')) {
        grouped.kitchen.push(area);
      } else if (id.includes('wohnzimmer') || name.includes('wohnzimmer')) {
        grouped.livingroom.push(area);
      } else if (id.includes('oben') || id.includes('upper') || name.includes('oben')) {
        grouped.upper.push(area);
      } else if (id.includes('erdgeschoss') || id.includes('ground')) {
        grouped.ground.push(area);
      } else {
        grouped.other.push(area);
      }
    }

    return grouped;
  },

  /**
   * Build individual area card
   * @param {Object} area - Area object
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Array} devices - Device registry
   * @param {Object} config - Strategy config
   * @returns {Object} Area card config
   */
  buildAreaCard(area, hass, entities, devices, config) {
    return {
      type: 'button',
      name: area.name,
      icon: area.icon || 'mdi:home',
      tap_action: {
        action: 'navigate',
        navigation_path: area.area_id,
      },
      show_state: false,
    };
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

console.info('[L30NEYN Overview View] Module loaded - v2.2.0 ✓ Column Layout: data-column + data-order');

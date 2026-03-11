/**
 * HA Custom Dashboard Strategy - Data Collectors
 * 
 * Collects and organizes entity data for different view types.
 * Applies filtering, grouping, and sorting based on config.
 * 
 * @version 1.0.0
 */

window.HaCustomDataCollectors = {
  /**
   * Collect light entities
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Object} config - Strategy config
   * @returns {Object} { on: [], off: [] }
   */
  collectLights(hass, entities, config) {
    const helpers = window.HaCustomHelpers;

    // Filter to light domain
    let lights = entities.filter(e => e.entity_id.startsWith('light.'));

    // Apply filters
    lights = helpers.filterByLabels(lights);
    lights = helpers.filterAvailable(lights);

    // Group by state
    const on = [];
    const off = [];

    lights.forEach(entity => {
      const state = hass.states[entity.entity_id];
      if (!state) return;

      if (state.state === 'on') {
        on.push(entity.entity_id);
      } else {
        off.push(entity.entity_id);
      }
    });

    return { on, off };
  },

  /**
   * Collect cover entities
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Object} config - Strategy config
   * @returns {Object} { open: [], closed: [] }
   */
  collectCovers(hass, entities, config) {
    const helpers = window.HaCustomHelpers;

    // Filter to cover domain
    let covers = entities.filter(e => e.entity_id.startsWith('cover.'));

    // Apply filters
    covers = helpers.filterByLabels(covers);
    covers = helpers.filterAvailable(covers);

    // Group by state
    const open = [];
    const closed = [];

    covers.forEach(entity => {
      const state = hass.states[entity.entity_id];
      if (!state) return;

      if (state.state === 'open') {
        open.push(entity.entity_id);
      } else {
        closed.push(entity.entity_id);
      }
    });

    return { open, closed };
  },

  /**
   * Collect security entities
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Object} config - Strategy config
   * @returns {Object} { locks: [], doors: [], windows: [], alarm: null }
   */
  collectSecurity(hass, entities, config) {
    const helpers = window.HaCustomHelpers;

    // Filter entities
    let securityEntities = entities.filter(e => {
      const domain = e.entity_id.split('.')[0];
      return [
        'lock',
        'binary_sensor',
        'alarm_control_panel',
        'cover',
      ].includes(domain);
    });

    securityEntities = helpers.filterByLabels(securityEntities);
    securityEntities = helpers.filterAvailable(securityEntities);

    const locks = [];
    const doors = [];
    const windows = [];
    let alarm = null;

    securityEntities.forEach(entity => {
      const state = hass.states[entity.entity_id];
      if (!state) return;

      const domain = entity.entity_id.split('.')[0];

      if (domain === 'lock') {
        locks.push(entity.entity_id);
      } else if (domain === 'alarm_control_panel') {
        alarm = entity.entity_id;
      } else if (domain === 'binary_sensor') {
        const deviceClass = state.attributes.device_class;
        if (deviceClass === 'door' || deviceClass === 'garage_door') {
          doors.push(entity.entity_id);
        } else if (deviceClass === 'window') {
          windows.push(entity.entity_id);
        }
      } else if (domain === 'cover') {
        const deviceClass = state.attributes.device_class;
        if (deviceClass === 'garage') {
          doors.push(entity.entity_id);
        }
      }
    });

    return { locks, doors, windows, alarm };
  },

  /**
   * Collect battery entities
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Object} config - Strategy config
   * @returns {Object} { critical: [], low: [], good: [] }
   */
  collectBatteries(hass, entities, config) {
    const helpers = window.HaCustomHelpers;

    // Filter to battery sensors
    let batteries = entities.filter(e => {
      if (!e.entity_id.startsWith('sensor.')) return false;

      const state = hass.states[e.entity_id];
      if (!state) return false;

      return (
        state.attributes.device_class === 'battery' ||
        state.attributes.unit_of_measurement === '%'
      );
    });

    batteries = helpers.filterByLabels(batteries);
    batteries = helpers.filterAvailable(batteries);

    // Group by level
    const critical = [];
    const low = [];
    const good = [];

    batteries.forEach(entity => {
      const state = hass.states[entity.entity_id];
      if (!state) return;

      const level = parseFloat(state.state);
      if (isNaN(level)) return;

      if (level < 20) {
        critical.push(entity.entity_id);
      } else if (level < 50) {
        low.push(entity.entity_id);
      } else {
        good.push(entity.entity_id);
      }
    });

    return { critical, low, good };
  },

  /**
   * Collect room entities
   * @param {string} areaId - Area ID
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Array} devices - Device registry
   * @param {Object} config - Strategy config
   * @returns {Object} Map of domain to entity IDs
   */
  collectRoomEntities(areaId, hass, entities, devices, config) {
    const helpers = window.HaCustomHelpers;

    // Build device-area map
    const deviceAreaMap = helpers.buildDeviceAreaMap(devices);

    // Filter to this area
    let areaEntities = helpers.filterByArea(entities, areaId, deviceAreaMap);

    // Apply filters
    areaEntities = helpers.filterByLabels(areaEntities);
    areaEntities = helpers.filterAvailable(areaEntities);

    // Apply config hidden
    const areaOptions = config.areas_options?.[areaId] || {};
    const groupsOptions = areaOptions.groups_options || {};

    // Group by domain
    const domainGroups = helpers.groupByDomain(areaEntities);

    // Apply domain-specific filtering
    const result = {};
    for (const [domain, entities] of domainGroups) {
      const domainOption = groupsOptions[domain] || {};
      const hiddenIds = domainOption.hidden || [];
      const order = domainOption.order || [];

      let filtered = helpers.filterByConfigHidden(entities, hiddenIds);
      filtered = helpers.sortByOrder(filtered, order);

      if (filtered.length > 0) {
        result[domain] = filtered.map(e => e.entity_id);
      }
    }

    return result;
  },
};

console.info('[Data Collectors] Module loaded');

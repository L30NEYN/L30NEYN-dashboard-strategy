/**
 * HA Custom Dashboard Strategy - Helper Functions
 * 
 * Utility functions for entity filtering, sorting, and data processing.
 * Performance-optimized with Set-based lookups and early returns.
 * 
 * @version 1.0.0
 */

window.HaCustomHelpers = {
  /**
   * Filter entities by label exclusion
   * @param {Array} entities - Entity objects from registry
   * @param {Array} entityStates - Entity states from hass.states
   * @returns {Array} Filtered entities
   */
  filterByLabels(entities, entityStates) {
    return entities.filter(entity => {
      // Check if entity has 'no_dboard' label
      if (entity.labels && entity.labels.includes('no_dboard')) {
        return false;
      }
      return true;
    });
  },

  /**
   * Filter entities by area
   * @param {Array} entities - Entity objects
   * @param {string} areaId - Area ID
   * @param {Map} deviceAreaMap - Map of device ID to area ID
   * @returns {Array} Filtered entities
   */
  filterByArea(entities, areaId, deviceAreaMap) {
    return entities.filter(entity => {
      // Direct area assignment
      if (entity.area_id === areaId) return true;

      // Via device
      if (entity.device_id) {
        return deviceAreaMap.get(entity.device_id) === areaId;
      }

      return false;
    });
  },

  /**
   * Filter entities by domain
   * @param {Array} entities - Entity objects
   * @param {Array} domains - Array of domain names
   * @returns {Array} Filtered entities
   */
  filterByDomain(entities, domains) {
    const domainSet = new Set(domains);
    return entities.filter(entity => {
      const domain = entity.entity_id.split('.')[0];
      return domainSet.has(domain);
    });
  },

  /**
   * Filter out hidden/disabled entities from registry
   * @param {Array} entities - Entity objects
   * @returns {Array} Filtered entities
   */
  filterAvailable(entities) {
    return entities.filter(entity => {
      // Skip disabled entities
      if (entity.disabled_by) return false;

      // Skip hidden entities
      if (entity.hidden_by) return false;

      // Skip config/diagnostic entities
      if (entity.entity_category) return false;

      return true;
    });
  },

  /**
   * Filter entities by config hidden list
   * @param {Array} entities - Entity objects
   * @param {Array} hiddenIds - Array of entity IDs to hide
   * @returns {Array} Filtered entities
   */
  filterByConfigHidden(entities, hiddenIds = []) {
    const hiddenSet = new Set(hiddenIds);
    return entities.filter(entity => !hiddenSet.has(entity.entity_id));
  },

  /**
   * Sort entities by name
   * @param {Array} entities - Entity objects
   * @returns {Array} Sorted entities
   */
  sortByName(entities) {
    return [...entities].sort((a, b) => {
      const nameA = a.original_name || a.entity_id;
      const nameB = b.original_name || b.entity_id;
      return nameA.localeCompare(nameB);
    });
  },

  /**
   * Sort entities by custom order
   * @param {Array} entities - Entity objects
   * @param {Array} order - Array of entity IDs in desired order
   * @returns {Array} Sorted entities
   */
  sortByOrder(entities, order = []) {
    if (order.length === 0) return entities;

    const orderMap = new Map(order.map((id, index) => [id, index]));

    return [...entities].sort((a, b) => {
      const orderA = orderMap.get(a.entity_id) ?? 999;
      const orderB = orderMap.get(b.entity_id) ?? 999;

      if (orderA !== orderB) return orderA - orderB;

      // Fallback to name sort
      const nameA = a.original_name || a.entity_id;
      const nameB = b.original_name || b.entity_id;
      return nameA.localeCompare(nameB);
    });
  },

  /**
   * Group entities by domain
   * @param {Array} entities - Entity objects
   * @returns {Map} Map of domain to entities
   */
  groupByDomain(entities) {
    const groups = new Map();

    entities.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      if (!groups.has(domain)) {
        groups.set(domain, []);
      }
      groups.get(domain).push(entity);
    });

    return groups;
  },

  /**
   * Group entities by state
   * @param {Array} entityIds - Entity IDs
   * @param {Object} states - hass.states object
   * @param {Function} grouper - Function that returns group key for state
   * @returns {Map} Map of group key to entity IDs
   */
  groupByState(entityIds, states, grouper) {
    const groups = new Map();

    entityIds.forEach(entityId => {
      const state = states[entityId];
      if (!state) return;

      const groupKey = grouper(state);
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(entityId);
    });

    return groups;
  },

  /**
   * Build device-area map
   * @param {Array} devices - Device objects
   * @returns {Map} Map of device ID to area ID
   */
  buildDeviceAreaMap(devices) {
    const map = new Map();
    devices.forEach(device => {
      if (device.area_id) {
        map.set(device.id, device.area_id);
      }
    });
    return map;
  },

  /**
   * Strip room name from entity name
   * @param {string} entityName - Entity friendly name
   * @param {string} roomName - Room name to strip
   * @returns {string} Cleaned name
   */
  stripRoomName(entityName, roomName) {
    if (!entityName || !roomName) return entityName;

    // Remove room name from start
    let cleaned = entityName.replace(new RegExp(`^${roomName}\\s+`, 'i'), '');

    // Remove common prefixes
    cleaned = cleaned
      .replace(/^(Licht|Light|Lampe|Lamp)\s+/i, '')
      .replace(/^(Rollo|Cover|Vorhang|Curtain)\s+/i, '')
      .replace(/^(Schalter|Switch)\s+/i, '')
      .replace(/^(Sensor)\s+/i, '');

    return cleaned || entityName;
  },

  /**
   * Get entity state
   * @param {string} entityId - Entity ID
   * @param {Object} states - hass.states object
   * @returns {Object|null} State object
   */
  getState(entityId, states) {
    return states[entityId] || null;
  },

  /**
   * Check if entity is available
   * @param {string} entityId - Entity ID
   * @param {Object} states - hass.states object
   * @returns {boolean}
   */
  isAvailable(entityId, states) {
    const state = this.getState(entityId, states);
    return state && state.state !== 'unavailable' && state.state !== 'unknown';
  },
};

console.info('[Helpers] Module loaded');

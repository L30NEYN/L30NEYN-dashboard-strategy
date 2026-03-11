/**
 * HA Custom Dashboard Strategy - Statistics Collectors
 * 
 * Collects and calculates statistics for energy, climate, and system health.
 * Provides data for statistics cards.
 * 
 * @version 1.1.0
 */

window.HaCustomStatisticsCollectors = {
  /**
   * Collect energy statistics
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Object} config - Strategy config
   * @returns {Object} Energy statistics
   */
  collectEnergy(hass, entities, config) {
    const energyEntities = entities.filter(e => {
      const state = hass.states[e.entity_id];
      if (!state) return false;

      return (
        state.attributes.device_class === 'energy' ||
        state.attributes.unit_of_measurement === 'kWh' ||
        e.entity_id.includes('energy')
      );
    });

    let totalConsumption = 0;
    let totalProduction = 0;
    const consumers = [];
    const producers = [];

    energyEntities.forEach(entity => {
      const state = hass.states[entity.entity_id];
      if (!state || state.state === 'unavailable' || state.state === 'unknown') return;

      const value = parseFloat(state.state);
      if (isNaN(value)) return;

      // Determine if producer or consumer based on entity name
      if (entity.entity_id.includes('solar') || entity.entity_id.includes('production')) {
        totalProduction += value;
        producers.push({
          entity_id: entity.entity_id,
          name: state.attributes.friendly_name || entity.entity_id,
          value: value,
          unit: state.attributes.unit_of_measurement || 'kWh',
        });
      } else {
        totalConsumption += value;
        consumers.push({
          entity_id: entity.entity_id,
          name: state.attributes.friendly_name || entity.entity_id,
          value: value,
          unit: state.attributes.unit_of_measurement || 'kWh',
        });
      }
    });

    return {
      totalConsumption: totalConsumption.toFixed(2),
      totalProduction: totalProduction.toFixed(2),
      netConsumption: (totalConsumption - totalProduction).toFixed(2),
      consumers: consumers.sort((a, b) => b.value - a.value).slice(0, 5),
      producers: producers.sort((a, b) => b.value - a.value),
    };
  },

  /**
   * Collect climate statistics
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Array} areas - Area registry
   * @param {Object} config - Strategy config
   * @returns {Object} Climate statistics
   */
  collectClimate(hass, entities, areas, config) {
    const helpers = window.HaCustomHelpers;

    const tempSensors = entities.filter(e => {
      const state = hass.states[e.entity_id];
      if (!state) return false;

      return (
        state.attributes.device_class === 'temperature' ||
        state.attributes.unit_of_measurement === '°C' ||
        state.attributes.unit_of_measurement === '°F'
      );
    });

    const humiditySensors = entities.filter(e => {
      const state = hass.states[e.entity_id];
      if (!state) return false;

      return (
        state.attributes.device_class === 'humidity' ||
        state.attributes.unit_of_measurement === '%'
      );
    });

    // Calculate averages
    let tempSum = 0;
    let tempCount = 0;
    let humiditySum = 0;
    let humidityCount = 0;

    const roomTemps = [];
    const roomHumidity = [];

    tempSensors.forEach(entity => {
      const state = hass.states[entity.entity_id];
      if (!state || state.state === 'unavailable' || state.state === 'unknown') return;

      const value = parseFloat(state.state);
      if (isNaN(value)) return;

      tempSum += value;
      tempCount++;

      // Get area name
      const area = areas.find(a => a.area_id === entity.area_id);
      if (area) {
        roomTemps.push({
          area: area.name,
          value: value,
          unit: state.attributes.unit_of_measurement || '°C',
        });
      }
    });

    humiditySensors.forEach(entity => {
      const state = hass.states[entity.entity_id];
      if (!state || state.state === 'unavailable' || state.state === 'unknown') return;

      const value = parseFloat(state.state);
      if (isNaN(value)) return;

      humiditySum += value;
      humidityCount++;

      // Get area name
      const area = areas.find(a => a.area_id === entity.area_id);
      if (area) {
        roomHumidity.push({
          area: area.name,
          value: value,
          unit: '%',
        });
      }
    });

    return {
      avgTemperature: tempCount > 0 ? (tempSum / tempCount).toFixed(1) : 'N/A',
      avgHumidity: humidityCount > 0 ? (humiditySum / humidityCount).toFixed(0) : 'N/A',
      minTemperature: roomTemps.length > 0 ? Math.min(...roomTemps.map(r => r.value)).toFixed(1) : 'N/A',
      maxTemperature: roomTemps.length > 0 ? Math.max(...roomTemps.map(r => r.value)).toFixed(1) : 'N/A',
      roomTemps: roomTemps.sort((a, b) => b.value - a.value),
      roomHumidity: roomHumidity.sort((a, b) => b.value - a.value),
    };
  },

  /**
   * Collect system health statistics
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Object} config - Strategy config
   * @returns {Object} System health statistics
   */
  collectSystemHealth(hass, entities, config) {
    // Count entities by state
    const totalEntities = Object.keys(hass.states).length;
    let unavailableCount = 0;
    let unknownCount = 0;

    Object.values(hass.states).forEach(state => {
      if (state.state === 'unavailable') unavailableCount++;
      if (state.state === 'unknown') unknownCount++;
    });

    // Count devices
    const totalDevices = entities
      .map(e => e.device_id)
      .filter((id, index, self) => id && self.indexOf(id) === index)
      .length;

    // Check for updates
    const updateEntities = Object.keys(hass.states)
      .filter(id => id.startsWith('update.'))
      .map(id => hass.states[id])
      .filter(state => state.state === 'on');

    // Count automations
    const automations = Object.keys(hass.states).filter(id => id.startsWith('automation.'));
    const activeAutomations = automations.filter(id => hass.states[id].state === 'on');

    return {
      totalEntities,
      totalDevices,
      unavailableCount,
      unknownCount,
      healthPercentage: ((totalEntities - unavailableCount - unknownCount) / totalEntities * 100).toFixed(1),
      updatesAvailable: updateEntities.length,
      updateEntities: updateEntities.map(e => ({
        entity_id: e.entity_id,
        name: e.attributes.friendly_name || e.entity_id,
        version: e.attributes.latest_version,
      })),
      automations: {
        total: automations.length,
        active: activeAutomations.length,
      },
    };
  },

  /**
   * Collect network statistics
   * @param {Object} hass - Home Assistant object
   * @param {Array} entities - Entity registry
   * @param {Object} config - Strategy config
   * @returns {Object} Network statistics
   */
  collectNetwork(hass, entities, config) {
    // Find network-related sensors
    const networkEntities = entities.filter(e => {
      return (
        e.entity_id.includes('network') ||
        e.entity_id.includes('bandwidth') ||
        e.entity_id.includes('speedtest') ||
        e.entity_id.includes('ping')
      );
    });

    const stats = {
      download: null,
      upload: null,
      ping: null,
    };

    networkEntities.forEach(entity => {
      const state = hass.states[entity.entity_id];
      if (!state || state.state === 'unavailable' || state.state === 'unknown') return;

      if (entity.entity_id.includes('download')) {
        stats.download = {
          value: parseFloat(state.state),
          unit: state.attributes.unit_of_measurement || 'Mbit/s',
        };
      } else if (entity.entity_id.includes('upload')) {
        stats.upload = {
          value: parseFloat(state.state),
          unit: state.attributes.unit_of_measurement || 'Mbit/s',
        };
      } else if (entity.entity_id.includes('ping')) {
        stats.ping = {
          value: parseFloat(state.state),
          unit: state.attributes.unit_of_measurement || 'ms',
        };
      }
    });

    return stats;
  },
};

console.info('[Statistics Collectors] Module loaded');

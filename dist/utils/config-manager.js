/**
 * HA Custom Dashboard Strategy - Config Manager
 * 
 * Manages configuration persistence and synchronization.
 * Handles saving/loading from Home Assistant storage and input helpers.
 * 
 * @version 1.1.0
 */

window.HaCustomConfigManager = {
  /**
   * Default configuration
   */
  defaultConfig: {
    // Theme
    theme_mode: 'auto',
    color_scheme: 'default',

    // Overview
    show_welcome: true,
    show_areas: true,
    show_security: true,
    show_light_summary: true,
    show_battery_status: true,
    weather_entity: null,

    // Statistics
    show_energy_stats: true,
    show_climate_stats: true,
    show_system_health: true,
    show_network_stats: false,

    // Advanced
    debug_mode: false,

    // Area options
    areas_options: {},
  },

  /**
   * Load configuration
   * @param {Object} hass - Home Assistant object
   * @returns {Promise<Object>} Configuration object
   */
  async loadConfig(hass) {
    console.info('[Config Manager] Loading configuration...');

    try {
      // Try to load from input helpers first (UI-configured values)
      const inputHelperConfig = await this.loadFromInputHelpers(hass);

      // Merge with defaults
      const config = {
        ...this.defaultConfig,
        ...inputHelperConfig,
      };

      console.info('[Config Manager] Configuration loaded:', config);
      return config;
    } catch (error) {
      console.error('[Config Manager] Failed to load config:', error);
      return { ...this.defaultConfig };
    }
  },

  /**
   * Load configuration from input helpers
   * @param {Object} hass - Home Assistant object
   * @returns {Promise<Object>} Configuration from input helpers
   */
  async loadFromInputHelpers(hass) {
    const config = {};

    // Theme settings
    config.theme_mode = this.getInputSelectValue(hass, 'input_select.ha_custom_theme_mode') || 'auto';
    config.color_scheme = this.getInputSelectValue(hass, 'input_select.ha_custom_color_scheme') || 'default';

    // Overview settings
    config.show_welcome = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_welcome', true);
    config.show_areas = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_areas', true);
    config.show_security = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_security', true);
    config.show_light_summary = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_light_summary', true);
    config.show_battery_status = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_battery_status', true);
    config.weather_entity = this.getInputTextValue(hass, 'input_text.ha_custom_weather_entity');

    // Statistics settings
    config.show_energy_stats = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_energy_stats', true);
    config.show_climate_stats = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_climate_stats', true);
    config.show_system_health = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_system_health', true);
    config.show_network_stats = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_show_network_stats', false);

    // Advanced
    config.debug_mode = this.getInputBooleanValue(hass, 'input_boolean.ha_custom_debug_mode', false);

    return config;
  },

  /**
   * Save configuration
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Configuration to save
   * @returns {Promise<void>}
   */
  async saveConfig(hass, config) {
    console.info('[Config Manager] Saving configuration...');

    try {
      // Save to input helpers
      await this.saveToInputHelpers(hass, config);

      console.info('[Config Manager] Configuration saved successfully');
    } catch (error) {
      console.error('[Config Manager] Failed to save config:', error);
      throw error;
    }
  },

  /**
   * Save configuration to input helpers
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Configuration object
   * @returns {Promise<void>}
   */
  async saveToInputHelpers(hass, config) {
    const promises = [];

    // Theme settings
    if (config.theme_mode) {
      promises.push(
        this.setInputSelect(hass, 'input_select.ha_custom_theme_mode', config.theme_mode)
      );
    }
    if (config.color_scheme) {
      promises.push(
        this.setInputSelect(hass, 'input_select.ha_custom_color_scheme', config.color_scheme)
      );
    }

    // Overview settings
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_welcome', config.show_welcome)
    );
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_areas', config.show_areas)
    );
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_security', config.show_security)
    );
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_light_summary', config.show_light_summary)
    );
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_battery_status', config.show_battery_status)
    );

    if (config.weather_entity) {
      promises.push(
        this.setInputText(hass, 'input_text.ha_custom_weather_entity', config.weather_entity)
      );
    }

    // Statistics settings
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_energy_stats', config.show_energy_stats)
    );
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_climate_stats', config.show_climate_stats)
    );
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_system_health', config.show_system_health)
    );
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_show_network_stats', config.show_network_stats)
    );

    // Advanced
    promises.push(
      this.setInputBoolean(hass, 'input_boolean.ha_custom_debug_mode', config.debug_mode)
    );

    await Promise.all(promises);
  },

  /**
   * Get input_boolean value
   * @param {Object} hass - Home Assistant object
   * @param {string} entityId - Entity ID
   * @param {boolean} defaultValue - Default value
   * @returns {boolean} Boolean value
   */
  getInputBooleanValue(hass, entityId, defaultValue = false) {
    const state = hass.states[entityId];
    if (!state) return defaultValue;
    return state.state === 'on';
  },

  /**
   * Get input_select value
   * @param {Object} hass - Home Assistant object
   * @param {string} entityId - Entity ID
   * @returns {string|null} Selected value
   */
  getInputSelectValue(hass, entityId) {
    const state = hass.states[entityId];
    if (!state) return null;
    return state.state;
  },

  /**
   * Get input_text value
   * @param {Object} hass - Home Assistant object
   * @param {string} entityId - Entity ID
   * @returns {string|null} Text value
   */
  getInputTextValue(hass, entityId) {
    const state = hass.states[entityId];
    if (!state || !state.state) return null;
    return state.state;
  },

  /**
   * Set input_boolean value
   * @param {Object} hass - Home Assistant object
   * @param {string} entityId - Entity ID
   * @param {boolean} value - Value to set
   * @returns {Promise<void>}
   */
  async setInputBoolean(hass, entityId, value) {
    const service = value ? 'turn_on' : 'turn_off';
    return hass.callService('input_boolean', service, {
      entity_id: entityId,
    });
  },

  /**
   * Set input_select value
   * @param {Object} hass - Home Assistant object
   * @param {string} entityId - Entity ID
   * @param {string} value - Value to set
   * @returns {Promise<void>}
   */
  async setInputSelect(hass, entityId, value) {
    return hass.callService('input_select', 'select_option', {
      entity_id: entityId,
      option: value,
    });
  },

  /**
   * Set input_text value
   * @param {Object} hass - Home Assistant object
   * @param {string} entityId - Entity ID
   * @param {string} value - Value to set
   * @returns {Promise<void>}
   */
  async setInputText(hass, entityId, value) {
    return hass.callService('input_text', 'set_value', {
      entity_id: entityId,
      value: value,
    });
  },

  /**
   * Create required input helpers
   * @param {Object} hass - Home Assistant object
   * @returns {Promise<void>}
   */
  async createInputHelpers(hass) {
    console.info('[Config Manager] Creating input helpers...');

    // This would need to be done via configuration.yaml or UI
    // Providing YAML template for user
    console.warn('[Config Manager] Input helpers must be created manually. See documentation.');
  },

  /**
   * Reset configuration to defaults
   * @param {Object} hass - Home Assistant object
   * @returns {Promise<void>}
   */
  async resetConfig(hass) {
    console.info('[Config Manager] Resetting configuration to defaults...');
    await this.saveConfig(hass, this.defaultConfig);
    console.info('[Config Manager] Configuration reset complete');
  },
};

console.info('[Config Manager] Module loaded');

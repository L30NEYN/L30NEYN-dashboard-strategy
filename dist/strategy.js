/**
 * HA Custom Dashboard Strategy
 * 
 * A modular, performant Home Assistant dashboard strategy.
 * Automatically generates overview and room views with grouped entity controls.
 * Now with settings panel, theme management, and statistics.
 * 
 * @author Leon Heyn
 * @version 1.1.0
 * @license MIT
 */

class HaCustomDashboardStrategy {
  static async generateDashboard(info) {
    console.info('[Strategy] Generating dashboard...');
    const startTime = performance.now();

    const { hass, config } = info;

    // Load strategy config from config manager
    const strategyConfig = await window.HaCustomConfigManager.loadConfig(hass);
    const mergedConfig = { ...config, ...strategyConfig };

    // Apply theme
    if (window.HaCustomThemeManager) {
      window.HaCustomThemeManager.applyTheme(hass, mergedConfig);
    }

    // Fetch registries
    const registry = await this.fetchRegistries(hass);

    // Generate views
    const views = await this.generateViews(hass, mergedConfig, registry);

    const endTime = performance.now();
    console.info(`[Strategy] Dashboard generated in ${(endTime - startTime).toFixed(2)}ms`);

    return {
      views: views,
    };
  }

  static async generateView(info) {
    console.info('[Strategy] Generating view:', info.view.path);

    const { hass, config, view } = info;

    // Load strategy config
    const strategyConfig = await window.HaCustomConfigManager.loadConfig(hass);
    const mergedConfig = { ...config, ...strategyConfig };

    // Fetch registries
    const registry = await this.fetchRegistries(hass);

    // Generate specific view
    if (view.path === 'overview') {
      return window.HaCustomOverviewView.generate(hass, mergedConfig, registry);
    } else if (view.path === 'settings') {
      return window.HaCustomSettingsView.generate(hass, mergedConfig, registry);
    } else if (view.path === 'statistics') {
      return window.HaCustomStatisticsView.generate(hass, mergedConfig, registry);
    } else if (view.path.startsWith('settings-area-')) {
      const areaId = view.path.replace('settings-area-', '');
      return window.HaCustomSettingsView.generateAreaSettings(areaId, hass, mergedConfig, registry);
    } else {
      // Room view
      return window.HaCustomRoomView.generate(view.path, hass, mergedConfig, registry);
    }
  }

  /**
   * Fetch entity, device, and area registries
   * @param {Object} hass - Home Assistant object
   * @returns {Object} Registry data
   */
  static async fetchRegistries(hass) {
    try {
      const [entities, devices, areas] = await Promise.all([
        hass.callWS({ type: 'config/entity_registry/list' }),
        hass.callWS({ type: 'config/device_registry/list' }),
        hass.callWS({ type: 'config/area_registry/list' }),
      ]);

      return { entities, devices, areas };
    } catch (error) {
      console.error('[Strategy] Failed to fetch registries:', error);
      return { entities: [], devices: [], areas: [] };
    }
  }

  /**
   * Generate all views
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Registry data
   * @returns {Array} View configs
   */
  static async generateViews(hass, config, registry) {
    const views = [];

    // Overview view
    views.push(window.HaCustomOverviewView.generate(hass, config, registry));

    // Statistics view
    if (window.HaCustomStatisticsView) {
      views.push(window.HaCustomStatisticsView.generate(hass, config, registry));
    }

    // Room views
    const { areas } = registry;
    for (const area of areas) {
      // Skip areas with no_dboard label
      if (area.labels && area.labels.includes('no_dboard')) {
        continue;
      }

      const roomView = window.HaCustomRoomView.generate(area.area_id, hass, config, registry);
      views.push(roomView);
    }

    // Settings view (always last)
    if (window.HaCustomSettingsView) {
      views.push(window.HaCustomSettingsView.generate(hass, config, registry));
    }

    return views;
  }
}

// Register strategy
customElements.define(
  'll-strategy-ha-custom-dashboard',
  class extends HTMLElement {
    static async generate(info) {
      return HaCustomDashboardStrategy.generateDashboard(info);
    }

    static async generateView(info) {
      return HaCustomDashboardStrategy.generateView(info);
    }
  }
);

console.info('[Strategy] Registered as ll-strategy-ha-custom-dashboard v1.1.0');

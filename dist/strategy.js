/**
 * L30NEYN Dashboard Strategy
 * 
 * A modular, performant Home Assistant dashboard strategy by L30NEYN.
 * Automatically generates overview and room views with grouped entity controls.
 * Now with settings panel, theme management, and statistics.
 * 
 * @author L30NEYN (Leon Heyn)
 * @version 1.1.0
 * @license MIT
 */

class L30NEYNDashboardStrategy {
  static async generateDashboard(info) {
    console.info('[L30NEYN Strategy] Generating dashboard...');
    const startTime = performance.now();

    const { hass, config } = info;

    // Load strategy config from config manager
    const strategyConfig = await window.L30NEYNConfigManager.loadConfig(hass);
    const mergedConfig = { ...config, ...strategyConfig };

    // Apply theme
    if (window.L30NEYNThemeManager) {
      window.L30NEYNThemeManager.applyTheme(hass, mergedConfig);
    }

    // Fetch registries
    const registry = await this.fetchRegistries(hass);

    // Generate views
    const views = await this.generateViews(hass, mergedConfig, registry);

    const endTime = performance.now();
    console.info(`[L30NEYN Strategy] Dashboard generated in ${(endTime - startTime).toFixed(2)}ms`);

    return {
      views: views,
    };
  }

  static async generateView(info) {
    console.info('[L30NEYN Strategy] Generating view:', info.view.path);

    const { hass, config, view } = info;

    // Load strategy config
    const strategyConfig = await window.L30NEYNConfigManager.loadConfig(hass);
    const mergedConfig = { ...config, ...strategyConfig };

    // Fetch registries
    const registry = await this.fetchRegistries(hass);

    // Generate specific view
    if (view.path === 'overview') {
      return window.L30NEYNOverviewView.generate(hass, mergedConfig, registry);
    } else if (view.path === 'settings') {
      return window.L30NEYNSettingsView.generate(hass, mergedConfig, registry);
    } else if (view.path === 'statistics') {
      return window.L30NEYNStatisticsView.generate(hass, mergedConfig, registry);
    } else if (view.path.startsWith('settings-area-')) {
      const areaId = view.path.replace('settings-area-', '');
      return window.L30NEYNSettingsView.generateAreaSettings(areaId, hass, mergedConfig, registry);
    } else {
      // Room view
      return window.L30NEYNRoomView.generate(view.path, hass, mergedConfig, registry);
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
      console.error('[L30NEYN Strategy] Failed to fetch registries:', error);
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
    views.push(window.L30NEYNOverviewView.generate(hass, config, registry));

    // Statistics view
    if (window.L30NEYNStatisticsView) {
      views.push(window.L30NEYNStatisticsView.generate(hass, config, registry));
    }

    // Room views
    const { areas } = registry;
    for (const area of areas) {
      // Skip areas with no_dboard label
      if (area.labels && area.labels.includes('no_dboard')) {
        continue;
      }

      const roomView = window.L30NEYNRoomView.generate(area.area_id, hass, config, registry);
      views.push(roomView);
    }

    // Settings view (always last)
    if (window.L30NEYNSettingsView) {
      views.push(window.L30NEYNSettingsView.generate(hass, config, registry));
    }

    return views;
  }
}

// Register Dashboard Strategy
// IMPORTANT: Dashboard strategies need the FULL 'll-strategy-' prefix
// HA does NOT add it automatically for dashboard strategies!
customElements.define(
  'll-strategy-l30neyn-dashboard',
  class extends HTMLElement {
    static async generate(info) {
      return L30NEYNDashboardStrategy.generateDashboard(info);
    }

    static async generateView(info) {
      return L30NEYNDashboardStrategy.generateView(info);
    }
  }
);

console.info(
  '%c L30NEYN-DASHBOARD-STRATEGY %c v1.1.0 ',
  'background: #41BDF5; color: #fff; font-weight: bold; padding: 3px 5px;',
  'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;'
);

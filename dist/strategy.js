/**
 * L30NEYN Dashboard Strategy v2.2.0
 * 
 * A modular, performant Home Assistant dashboard strategy by L30NEYN.
 * Automatically generates overview and room views with:
 * - Fixed column layout (data-column, data-order)
 * - Integrated room controls (lights, covers)
 * - Grouped entity management
 * - Settings panel & theme management
 * - Statistics dashboard
 * 
 * @author L30NEYN (Leon Heyn)
 * @version 2.2.0
 * @license MIT
 * @homepage https://github.com/L30NEYN/L30NEYN-dashboard-strategy
 */

class L30NEYNDashboardStrategy {
  // Strategy metadata
  static METADATA = {
    version: '2.2.0',
    name: 'L30NEYN Dashboard Strategy',
    author: 'L30NEYN (Leon Heyn)',
    homepage: 'https://github.com/L30NEYN/L30NEYN-dashboard-strategy',
    issues: 'https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues',
  };

  /**
   * Main dashboard generation entry point
   * @param {Object} info - Dashboard info object
   * @returns {Promise<Object>} Dashboard config
   */
  static async generateDashboard(info) {
    console.info('[L30NEYN Strategy v2.2.0] Generating dashboard...');
    const startTime = performance.now();

    const { hass, config } = info;

    try {
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
    } catch (error) {
      console.error('[L30NEYN Strategy] Dashboard generation failed:', error);
      return {
        views: [
          {
            title: 'Error',
            path: 'error',
            cards: [
              {
                type: 'markdown',
                content: `# Dashboard Generation Error\n\n\`\`\`\n${error.message}\n\`\`\`\n\nCheck browser console for details.`,
              },
            ],
          },
        ],
      };
    }
  }

  /**
   * Generate specific view
   * @param {Object} info - View info object
   * @returns {Promise<Object>} View config
   */
  static async generateView(info) {
    console.info('[L30NEYN Strategy v2.2.0] Generating view:', info.view.path);

    const { hass, config, view } = info;

    try {
      // Load strategy config
      const strategyConfig = await window.L30NEYNConfigManager.loadConfig(hass);
      const mergedConfig = { ...config, ...strategyConfig };

      // Fetch registries
      const registry = await this.fetchRegistries(hass);

      // Generate specific view based on path
      const viewPath = view.path || 'overview';

      if (viewPath === 'overview') {
        return window.L30NEYNOverviewView.generate(hass, mergedConfig, registry);
      } else if (viewPath === 'settings') {
        return window.L30NEYNSettingsView.generate(hass, mergedConfig, registry);
      } else if (viewPath === 'statistics') {
        return window.L30NEYNStatisticsView.generate(hass, mergedConfig, registry);
      } else if (viewPath.startsWith('settings-area-')) {
        const areaId = viewPath.replace('settings-area-', '');
        return window.L30NEYNSettingsView.generateAreaSettings(areaId, hass, mergedConfig, registry);
      } else {
        // Room view - with NEW v2.2.0 controls
        return window.L30NEYNRoomView.generate(viewPath, hass, mergedConfig, registry);
      }
    } catch (error) {
      console.error('[L30NEYN Strategy] View generation failed:', error);
      return {
        title: 'Error',
        path: view.path || 'error',
        cards: [
          {
            type: 'markdown',
            content: `# View Generation Error\n\n\`\`\`\n${error.message}\n\`\`\``,
          },
        ],
      };
    }
  }

  /**
   * Fetch entity, device, area, and floor registries from Home Assistant
   * @param {Object} hass - Home Assistant object
   * @returns {Promise<Object>} Registry data
   */
  static async fetchRegistries(hass) {
    try {
      const [entities, devices, areas, floors] = await Promise.all([
        hass.callWS({ type: 'config/entity_registry/list' }),
        hass.callWS({ type: 'config/device_registry/list' }),
        hass.callWS({ type: 'config/area_registry/list' }),
        hass.callWS({ type: 'config/floor_registry/list' }).catch(() => []), // Optional
      ]);

      console.debug('[L30NEYN Strategy] Registries loaded:', {
        entities: entities.length,
        devices: devices.length,
        areas: areas.length,
        floors: floors.length,
      });

      return { entities, devices, areas, floors };
    } catch (error) {
      console.error('[L30NEYN Strategy] Registry fetch failed:', error);
      return { entities: [], devices: [], areas: [], floors: [] };
    }
  }

  /**
   * Generate all views (overview, rooms, statistics, settings)
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Registry data
   * @returns {Promise<Array>} View configs array
   */
  static async generateViews(hass, config, registry) {
    const views = [];

    try {
      // 1. Overview view (with column layout)
      const overviewView = window.L30NEYNOverviewView.generate(hass, config, registry);
      views.push(overviewView);
      console.debug('[L30NEYN Strategy] Overview view generated');

      // 2. Statistics view (if available)
      if (window.L30NEYNStatisticsView) {
        const statsView = window.L30NEYNStatisticsView.generate(hass, config, registry);
        views.push(statsView);
        console.debug('[L30NEYN Strategy] Statistics view generated');
      }

      // 3. Room views (with v2.2.0 controls)
      const { areas } = registry;
      for (const area of areas) {
        // Skip areas with no_dboard label
        if (area.labels && area.labels.includes('no_dboard')) {
          continue;
        }

        const roomView = window.L30NEYNRoomView.generate(area.area_id, hass, config, registry);
        views.push(roomView);
      }
      console.debug(`[L30NEYN Strategy] ${areas.length} room views generated`);

      // 4. Settings view (always last)
      if (window.L30NEYNSettingsView) {
        const settingsView = window.L30NEYNSettingsView.generate(hass, config, registry);
        views.push(settingsView);
        console.debug('[L30NEYN Strategy] Settings view generated');
      }

      console.info(`[L30NEYN Strategy] All views generated: ${views.length} total`);
      return views;
    } catch (error) {
      console.error('[L30NEYN Strategy] View generation error:', error);
      throw error;
    }
  }
}

/**
 * Register Dashboard Strategy as HTML element
 * 
 * HA naming convention:
 * - Element registered as: ll-strategy-dashboard-l30neyn
 * - Usage in YAML: strategy: type: custom:l30neyn-dashboard-strategy
 * - HA automatically prepends 'll-strategy-dashboard-' to the strategy name
 * 
 * @see https://developers.home-assistant.io/docs/frontend/custom-ui/lovelace/strategies
 */
customElements.define(
  'll-strategy-dashboard-l30neyn',
  class extends HTMLElement {
    /**
     * Static generate method for dashboard generation
     * @param {Object} info - Dashboard info
     * @returns {Promise<Object>} Dashboard config
     */
    static async generate(info) {
      return L30NEYNDashboardStrategy.generateDashboard(info);
    }

    /**
     * Static generateView method for individual view generation
     * @param {Object} info - View info
     * @returns {Promise<Object>} View config
     */
    static async generateView(info) {
      return L30NEYNDashboardStrategy.generateView(info);
    }
  }
);

// Console branding
console.info(
  '%c L30NEYN-DASHBOARD-STRATEGY %c v2.2.0 ',
  'background: #41BDF5; color: #fff; font-weight: bold; padding: 3px 5px; border-radius: 3px;',
  'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px; border-radius: 3px;'
);

console.log(
  '%cFeatures: %cColumn Layout • Room Controls • Statistics • Theme Management',
  'font-weight: bold;',
  'color: #888;'
);

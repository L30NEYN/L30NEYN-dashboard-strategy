/**
 * HA Custom Dashboard Strategy - Main Strategy
 * 
 * Generates the dashboard configuration based on Home Assistant areas,
 * devices, and entities. Supports extensive customization through config.
 * 
 * @version 1.0.0
 */

class HaCustomDashboardStrategy {
  /**
   * Generate dashboard configuration
   * @param {Object} config - Strategy configuration
   * @param {Object} hass - Home Assistant object
   * @returns {Promise<Object>} Dashboard configuration
   */
  static async generate(config, hass) {
    console.log('[Strategy] Generating dashboard...', { config });

    try {
      // Extract config with defaults
      const strategyConfig = {
        show_weather: config.show_weather ?? true,
        show_energy: config.show_energy ?? true,
        show_subviews: config.show_subviews ?? false,
        show_search_card: config.show_search_card ?? false,
        show_covers_summary: config.show_covers_summary ?? true,
        summaries_columns: config.summaries_columns ?? 2,
        group_by_floors: config.group_by_floors ?? false,
        areas_display: config.areas_display ?? { hidden: [], order: [] },
        areas_options: config.areas_options ?? {},
        room_pin_entities: config.room_pin_entities ?? [],
      };

      // Get registries from hass (no WebSocket calls needed!)
      const areas = Object.values(hass.areas || {});
      const devices = Object.values(hass.devices || {});
      const entities = Object.values(hass.entities || {});
      const floors = Object.values(hass.floors || {});

      console.log('[Strategy] Registries loaded', {
        areas: areas.length,
        devices: devices.length,
        entities: entities.length,
        floors: floors.length,
      });

      // Build area-device-entity mappings
      const areaDeviceMap = new Map();
      const deviceEntityMap = new Map();
      
      devices.forEach(device => {
        if (device.area_id) {
          if (!areaDeviceMap.has(device.area_id)) {
            areaDeviceMap.set(device.area_id, []);
          }
          areaDeviceMap.get(device.area_id).push(device.id);
        }
      });

      entities.forEach(entity => {
        if (entity.device_id) {
          if (!deviceEntityMap.has(entity.device_id)) {
            deviceEntityMap.set(entity.device_id, []);
          }
          deviceEntityMap.get(entity.device_id).push(entity.entity_id);
        }
      });

      // Filter and sort areas
      let visibleAreas = areas.filter(
        area => !strategyConfig.areas_display.hidden?.includes(area.area_id)
      );

      // Apply custom order
      if (strategyConfig.areas_display.order?.length > 0) {
        const orderMap = new Map(
          strategyConfig.areas_display.order.map((id, index) => [id, index])
        );
        visibleAreas.sort((a, b) => {
          const orderA = orderMap.get(a.area_id) ?? 999;
          const orderB = orderMap.get(b.area_id) ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
      } else {
        visibleAreas.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Build views array
      const views = [];

      // Overview view
      views.push({
        title: 'Übersicht',
        path: 'overview',
        icon: 'mdi:home',
        type: 'sections',
        sections: await this.buildOverviewSections(
          strategyConfig,
          visibleAreas,
          hass
        ),
      });

      // Room views
      for (const area of visibleAreas) {
        views.push({
          title: area.name,
          path: area.area_id,
          icon: area.icon || 'mdi:floor-plan',
          strategy: {
            type: 'custom:ha-custom-view-room',
            area_id: area.area_id,
            config: strategyConfig,
            registries: { areas, devices, entities, floors },
          },
        });
      }

      // Utility views
      if (strategyConfig.show_subviews) {
        views.push({
          title: 'Lichter',
          path: 'lights',
          icon: 'mdi:lightbulb-group',
          strategy: {
            type: 'custom:ha-custom-view-lights',
            config: strategyConfig,
            registries: { areas, devices, entities },
          },
        });

        if (strategyConfig.show_covers_summary) {
          views.push({
            title: 'Rollos',
            path: 'covers',
            icon: 'mdi:window-shutter',
            strategy: {
              type: 'custom:ha-custom-view-covers',
              config: strategyConfig,
              registries: { areas, devices, entities },
            },
          });
        }

        views.push({
          title: 'Sicherheit',
          path: 'security',
          icon: 'mdi:shield-home',
          strategy: {
            type: 'custom:ha-custom-view-security',
            config: strategyConfig,
            registries: { areas, devices, entities },
          },
        });

        views.push({
          title: 'Batterien',
          path: 'batteries',
          icon: 'mdi:battery',
          strategy: {
            type: 'custom:ha-custom-view-batteries',
            config: strategyConfig,
            registries: { areas, devices, entities },
          },
        });
      }

      const dashboardConfig = {
        views,
      };

      console.log('[Strategy] Dashboard generated', {
        views: views.length,
        config: dashboardConfig,
      });

      return dashboardConfig;
    } catch (error) {
      console.error('[Strategy] Error generating dashboard:', error);
      throw error;
    }
  }

  /**
   * Build overview sections
   * @param {Object} config - Strategy configuration
   * @param {Array} areas - Visible areas
   * @param {Object} hass - Home Assistant object
   * @returns {Promise<Array>} Sections array
   */
  static async buildOverviewSections(config, areas, hass) {
    const sections = [];

    // Summary section
    const summaryCards = [];

    // Weather card
    if (config.show_weather) {
      const weatherEntities = Object.keys(hass.states).filter(id =>
        id.startsWith('weather.')
      );
      if (weatherEntities.length > 0) {
        summaryCards.push({
          type: 'weather-forecast',
          entity: weatherEntities[0],
          show_forecast: true,
        });
      }
    }

    // Energy card
    if (config.show_energy) {
      summaryCards.push({
        type: 'energy-distribution',
      });
    }

    if (summaryCards.length > 0) {
      sections.push({
        type: 'grid',
        cards: summaryCards,
        column_span: 1,
      });
    }

    // Area cards
    const areaCards = areas.map(area => ({
      type: 'tile',
      entity: `zone.${area.area_id}`,
      name: area.name,
      icon: area.icon || 'mdi:floor-plan',
      tap_action: {
        action: 'navigate',
        navigation_path: `/dashboard-strategy/${area.area_id}`,
      },
    }));

    if (areaCards.length > 0) {
      sections.push({
        type: 'grid',
        cards: areaCards,
        column_span: 1,
      });
    }

    return sections;
  }
}

// Register the strategy
customElements.define(
  'll-strategy-ha-custom-dashboard',
  class extends HTMLElement {
    static async generate(config, hass) {
      return HaCustomDashboardStrategy.generate(config, hass);
    }
  }
);

console.info('[Strategy] Custom element registered: ll-strategy-ha-custom-dashboard');

/**
 * HA Custom Dashboard Strategy - Settings View
 * 
 * Provides a graphical settings panel for configuring the dashboard.
 * Allows theme selection, area configuration, and feature toggles.
 * 
 * @version 1.1.0
 */

window.HaCustomSettingsView = {
  /**
   * Generate settings view
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Entity/device/area registry
   * @returns {Object} View config
   */
  generate(hass, config, registry) {
    const cards = [];

    // Welcome card
    cards.push(this.buildWelcomeCard());

    // Theme settings
    cards.push(this.buildThemeSettingsCard(config));

    // Overview settings
    cards.push(this.buildOverviewSettingsCard(config));

    // Statistics settings
    cards.push(this.buildStatisticsSettingsCard(config));

    // Area configuration
    cards.push(this.buildAreaConfigCard(registry.areas, config));

    // Advanced settings
    cards.push(this.buildAdvancedSettingsCard(config));

    // Save button
    cards.push(this.buildSaveButtonCard());

    return {
      title: 'Einstellungen',
      path: 'settings',
      icon: 'mdi:cog',
      cards: cards,
    };
  },

  /**
   * Build welcome card
   * @returns {Object} Card config
   */
  buildWelcomeCard() {
    return {
      type: 'markdown',
      content: `# Dashboard-Einstellungen

Hier kannst du dein Dashboard anpassen. Änderungen werden automatisch gespeichert.

**Tipp:** Verwende das Label \`no_dboard\` um Entitäten oder Räume auszublenden.`,
    };
  },

  /**
   * Build theme settings card
   * @param {Object} config - Strategy config
   * @returns {Object} Card config
   */
  buildThemeSettingsCard(config) {
    const themeManager = window.HaCustomThemeManager;
    const currentTheme = themeManager.getTheme();
    const colorSchemes = themeManager.getAvailableColorSchemes();

    return {
      type: 'entities',
      title: 'Design & Theme',
      icon: 'mdi:palette',
      entities: [
        {
          type: 'custom:mushroom-select-card',
          entity: 'input_select.ha_custom_theme_mode',
          name: 'Theme-Modus',
          icon: 'mdi:theme-light-dark',
          secondary: 'Wähle Hell, Dunkel oder Automatisch',
        },
        {
          type: 'custom:mushroom-select-card',
          entity: 'input_select.ha_custom_color_scheme',
          name: 'Farbschema',
          icon: 'mdi:palette',
          secondary: 'Wähle dein bevorzugtes Farbschema',
        },
        {
          type: 'divider',
        },
        {
          type: 'custom:mushroom-chips-card',
          chips: colorSchemes.map(scheme => ({
            type: 'template',
            icon: scheme.icon,
            content: scheme.name,
            icon_color: scheme.color ? undefined : 'grey',
            tap_action: {
              action: 'call-service',
              service: 'input_select.select_option',
              service_data: {
                entity_id: 'input_select.ha_custom_color_scheme',
                option: scheme.id,
              },
            },
          })),
        },
      ],
    };
  },

  /**
   * Build overview settings card
   * @param {Object} config - Strategy config
   * @returns {Object} Card config
   */
  buildOverviewSettingsCard(config) {
    return {
      type: 'entities',
      title: 'Übersichtsseite',
      icon: 'mdi:home',
      entities: [
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_welcome',
          name: 'Begrüßung anzeigen',
          icon: 'mdi:hand-wave',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_areas',
          name: 'Raumübersicht anzeigen',
          icon: 'mdi:home-group',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_security',
          name: 'Sicherheitsstatus anzeigen',
          icon: 'mdi:shield-home',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_light_summary',
          name: 'Licht-Zusammenfassung anzeigen',
          icon: 'mdi:lightbulb-group',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_battery_status',
          name: 'Batteriestatus anzeigen',
          icon: 'mdi:battery',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_text.ha_custom_weather_entity',
          name: 'Wetter-Entität',
          icon: 'mdi:weather-partly-cloudy',
          secondary: 'Lässt leer für automatische Erkennung',
        },
      ],
    };
  },

  /**
   * Build statistics settings card
   * @param {Object} config - Strategy config
   * @returns {Object} Card config
   */
  buildStatisticsSettingsCard(config) {
    return {
      type: 'entities',
      title: 'Statistiken',
      icon: 'mdi:chart-line',
      entities: [
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_energy_stats',
          name: 'Energie-Statistiken',
          icon: 'mdi:lightning-bolt',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_climate_stats',
          name: 'Klima-Statistiken',
          icon: 'mdi:thermometer',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_system_health',
          name: 'System-Gesundheit',
          icon: 'mdi:server',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_show_network_stats',
          name: 'Netzwerk-Statistiken',
          icon: 'mdi:network',
          tap_action: {
            action: 'toggle',
          },
        },
      ],
    };
  },

  /**
   * Build area configuration card
   * @param {Array} areas - Area registry
   * @param {Object} config - Strategy config
   * @returns {Object} Card config
   */
  buildAreaConfigCard(areas, config) {
    const entities = [];

    entities.push({
      type: 'section',
      label: 'Klicke auf einen Raum zum Konfigurieren',
    });

    areas
      .filter(area => !area.labels || !area.labels.includes('no_dboard'))
      .forEach(area => {
        entities.push({
          type: 'custom:mushroom-entity-card',
          name: area.name,
          icon: area.icon || 'mdi:home',
          tap_action: {
            action: 'navigate',
            navigation_path: `/dashboard-custom/settings-area-${area.area_id}`,
          },
          icon_color: 'blue',
        });
      });

    return {
      type: 'entities',
      title: 'Raum-Konfiguration',
      icon: 'mdi:home-edit',
      entities: entities,
    };
  },

  /**
   * Build advanced settings card
   * @param {Object} config - Strategy config
   * @returns {Object} Card config
   */
  buildAdvancedSettingsCard(config) {
    return {
      type: 'entities',
      title: 'Erweitert',
      icon: 'mdi:cog-outline',
      entities: [
        {
          type: 'custom:mushroom-entity-card',
          entity: 'input_boolean.ha_custom_debug_mode',
          name: 'Debug-Modus',
          icon: 'mdi:bug',
          secondary: 'Zeigt erweiterte Logs in der Konsole',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'button',
          name: 'Konfiguration exportieren',
          icon: 'mdi:download',
          tap_action: {
            action: 'call-service',
            service: 'script.ha_custom_export_config',
          },
        },
        {
          type: 'button',
          name: 'Konfiguration zurücksetzen',
          icon: 'mdi:refresh',
          tap_action: {
            action: 'call-service',
            service: 'script.ha_custom_reset_config',
            confirmation: {
              text: 'Wirklich alle Einstellungen zurücksetzen?',
            },
          },
        },
      ],
    };
  },

  /**
   * Build save button card
   * @returns {Object} Card config
   */
  buildSaveButtonCard() {
    return {
      type: 'custom:mushroom-chips-card',
      chips: [
        {
          type: 'action',
          icon: 'mdi:content-save',
          tap_action: {
            action: 'call-service',
            service: 'script.ha_custom_save_config',
          },
        },
        {
          type: 'action',
          icon: 'mdi:refresh',
          tap_action: {
            action: 'call-service',
            service: 'homeassistant.reload_config_entry',
            confirmation: {
              text: 'Dashboard neu laden?',
            },
          },
        },
      ],
    };
  },

  /**
   * Generate area settings view
   * @param {string} areaId - Area ID
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Entity/device/area registry
   * @returns {Object} View config
   */
  generateAreaSettings(areaId, hass, config, registry) {
    const area = registry.areas.find(a => a.area_id === areaId);
    if (!area) {
      return {
        title: 'Fehler',
        path: `settings-area-${areaId}`,
        cards: [{
          type: 'markdown',
          content: 'Raum nicht gefunden.',
        }],
      };
    }

    const cards = [];

    // Area info
    cards.push({
      type: 'markdown',
      content: `# ${area.name}\n\nKonfiguriere die Geräteanzeige für diesen Raum.`,
    });

    // Domain configuration
    const domains = ['light', 'cover', 'climate', 'switch', 'sensor'];
    domains.forEach(domain => {
      cards.push(this.buildDomainConfigCard(areaId, domain, config));
    });

    return {
      title: `${area.name} - Einstellungen`,
      path: `settings-area-${areaId}`,
      icon: area.icon || 'mdi:home',
      cards: cards,
    };
  },

  /**
   * Build domain configuration card for area
   * @param {string} areaId - Area ID
   * @param {string} domain - Domain name
   * @param {Object} config - Strategy config
   * @returns {Object} Card config
   */
  buildDomainConfigCard(areaId, domain, config) {
    const domainTitles = {
      light: 'Beleuchtung',
      cover: 'Rollos',
      climate: 'Klima',
      switch: 'Schalter',
      sensor: 'Sensoren',
    };

    return {
      type: 'entities',
      title: domainTitles[domain] || domain,
      icon: this.getDomainIcon(domain),
      entities: [
        {
          type: 'custom:mushroom-entity-card',
          entity: `input_boolean.ha_custom_${areaId}_${domain}_enabled`,
          name: 'Anzeigen',
          tap_action: {
            action: 'toggle',
          },
        },
        {
          type: 'button',
          name: 'Entitäten sortieren',
          icon: 'mdi:sort',
          tap_action: {
            action: 'navigate',
            navigation_path: `/dashboard-custom/settings-sort-${areaId}-${domain}`,
          },
        },
        {
          type: 'button',
          name: 'Entitäten ausblenden',
          icon: 'mdi:eye-off',
          tap_action: {
            action: 'navigate',
            navigation_path: `/dashboard-custom/settings-hide-${areaId}-${domain}`,
          },
        },
      ],
    };
  },

  /**
   * Get icon for domain
   * @param {string} domain - Domain name
   * @returns {string} Icon name
   */
  getDomainIcon(domain) {
    const icons = {
      light: 'mdi:lightbulb',
      cover: 'mdi:window-shutter',
      climate: 'mdi:thermostat',
      switch: 'mdi:light-switch',
      sensor: 'mdi:chart-line',
    };
    return icons[domain] || 'mdi:devices';
  },
};

console.info('[Settings View] Module loaded');

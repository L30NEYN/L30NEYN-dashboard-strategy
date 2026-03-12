/**
 * L30NEYN Dashboard Strategy - Bundled Single File
 *
 * All modules inlined to avoid async loading race condition with
 * Home Assistant's customElements registration timeout.
 *
 * @author L30NEYN
 * @version 1.2.1
 * @license MIT
 * @see https://github.com/L30NEYN/L30NEYN-dashboard-strategy
 */

(function () {
  'use strict';

  const VERSION = '1.2.1';

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  window.L30NEYNHelpers = {
    filterByLabels(entities) {
      return entities.filter(e => {
        if (!e || !e.entity_id) return false;
        return !(e.labels && e.labels.includes('no_dboard'));
      });
    },
    filterByArea(entities, areaId, deviceAreaMap) {
      return entities.filter(e => {
        if (!e || !e.entity_id) return false;
        if (e.area_id === areaId) return true;
        if (e.device_id) return deviceAreaMap.get(e.device_id) === areaId;
        return false;
      });
    },
    filterByDomain(entities, domains) {
      const s = new Set(domains);
      return entities.filter(e => {
        if (!e || !e.entity_id) return false;
        return s.has(e.entity_id.split('.')[0]);
      });
    },
    filterAvailable(entities) {
      return entities.filter(e => {
        if (!e || !e.entity_id) return false;
        if (e.disabled_by) return false;
        if (e.hidden_by) return false;
        if (e.entity_category) return false;
        return true;
      });
    },
    filterByConfigHidden(entities, hiddenIds = []) {
      const s = new Set(hiddenIds);
      return entities.filter(e => e && e.entity_id && !s.has(e.entity_id));
    },
    sortByName(entities) {
      return [...entities].sort((a, b) =>
        (a.original_name || a.entity_id || '').localeCompare(b.original_name || b.entity_id || '')
      );
    },
    sortByOrder(entities, order = []) {
      if (!order.length) return entities;
      const m = new Map(order.map((id, i) => [id, i]));
      return [...entities].sort((a, b) => {
        const oa = m.get(a.entity_id) ?? 999;
        const ob = m.get(b.entity_id) ?? 999;
        if (oa !== ob) return oa - ob;
        return (a.original_name || a.entity_id || '').localeCompare(b.original_name || b.entity_id || '');
      });
    },
    groupByDomain(entities) {
      const g = new Map();
      entities.forEach(e => {
        if (!e || !e.entity_id) return;
        const d = e.entity_id.split('.')[0];
        if (!g.has(d)) g.set(d, []);
        g.get(d).push(e);
      });
      return g;
    },
    buildDeviceAreaMap(devices) {
      const m = new Map();
      (devices || []).forEach(d => { if (d && d.area_id) m.set(d.id, d.area_id); });
      return m;
    },
    isAvailable(entityId, states) {
      if (!entityId || !states) return false;
      const s = states[entityId];
      return s && s.state !== 'unavailable' && s.state !== 'unknown';
    },
  };

  // ─── CARD BUILDERS ────────────────────────────────────────────────────────

  window.L30NEYNCardBuilders = {
    buildEntityCard(entity, options = {}) {
      return { type: 'entity', entity: Array.isArray(entity) ? entity[0] : entity, ...options };
    },
    buildEntitiesCard(entities, options = {}) {
      return { type: 'entities', entities, ...options };
    },
    buildLightCard(entity, options = {}) {
      return { type: 'light', entity: Array.isArray(entity) ? entity[0] : entity, ...options };
    },
    buildGroupControlCard(entities, domain, options = {}) {
      const cfg = { type: 'entities', title: options.title || 'Gruppensteuerung', entities: [], ...options };
      if (domain === 'light') {
        cfg.entities.push({ type: 'button', name: 'Alle an', icon: 'mdi:lightbulb-on', tap_action: { action: 'call-service', service: 'light.turn_on', service_data: { entity_id: entities } } });
        cfg.entities.push({ type: 'button', name: 'Alle aus', icon: 'mdi:lightbulb-off', tap_action: { action: 'call-service', service: 'light.turn_off', service_data: { entity_id: entities } } });
      } else if (domain === 'cover') {
        cfg.entities.push({ type: 'button', name: 'Alle öffnen', icon: 'mdi:arrow-up', tap_action: { action: 'call-service', service: 'cover.open_cover', service_data: { entity_id: entities } } });
        cfg.entities.push({ type: 'button', name: 'Alle schließen', icon: 'mdi:arrow-down', tap_action: { action: 'call-service', service: 'cover.close_cover', service_data: { entity_id: entities } } });
      }
      return cfg;
    },
    buildSensorCard(entities, options = {}) {
      return { type: 'entities', entities, ...options };
    },
    buildWeatherCard(entity, options = {}) {
      return { type: 'weather-forecast', entity, show_forecast: true, ...options };
    },
    buildBatteryCard(critical, low, options = {}) {
      const entities = [];
      if (critical.length) { entities.push({ type: 'section', label: 'Kritisch (<20%)' }); entities.push(...critical); }
      if (low.length) { entities.push({ type: 'section', label: 'Niedrig (<50%)' }); entities.push(...low); }
      if (!entities.length) entities.push({ type: 'label', label: 'Alle Batterien in Ordnung ✓' });
      return { type: 'entities', title: 'Batteriestatus', entities, ...options };
    },
    buildSecurityCard(data, options = {}) {
      const entities = [];
      if (data.alarm) entities.push(data.alarm);
      if (data.locks.length) { entities.push({ type: 'section', label: 'Schlösser' }); entities.push(...data.locks); }
      if (data.doors.length) { entities.push({ type: 'section', label: 'Türen' }); entities.push(...data.doors); }
      if (data.windows.length) { entities.push({ type: 'section', label: 'Fenster' }); entities.push(...data.windows); }
      return { type: 'entities', title: 'Sicherheit', entities, ...options };
    },
  };

  // ─── DATA COLLECTORS ──────────────────────────────────────────────────────

  window.L30NEYNDataCollectors = {
    collectLights(hass, entities, config) {
      const h = window.L30NEYNHelpers;
      let lights = h.filterAvailable(h.filterByLabels(
        entities.filter(e => e && e.entity_id && e.entity_id.startsWith('light.'))
      ));
      const on = [], off = [];
      lights.forEach(e => {
        const s = hass.states[e.entity_id]; if (!s) return;
        s.state === 'on' ? on.push(e.entity_id) : off.push(e.entity_id);
      });
      return { on, off };
    },
    collectCovers(hass, entities, config) {
      const h = window.L30NEYNHelpers;
      let covers = h.filterAvailable(h.filterByLabels(
        entities.filter(e => e && e.entity_id && e.entity_id.startsWith('cover.'))
      ));
      const open = [], closed = [];
      covers.forEach(e => {
        const s = hass.states[e.entity_id]; if (!s) return;
        s.state === 'open' ? open.push(e.entity_id) : closed.push(e.entity_id);
      });
      return { open, closed };
    },
    collectSecurity(hass, entities, config) {
      const h = window.L30NEYNHelpers;
      const SECURITY_DOMAINS = new Set(['lock','binary_sensor','alarm_control_panel','cover']);
      let sec = h.filterAvailable(h.filterByLabels(
        entities.filter(e => e && e.entity_id && SECURITY_DOMAINS.has(e.entity_id.split('.')[0]))
      ));
      const locks = [], doors = [], windows = [];
      let alarm = null;
      sec.forEach(e => {
        const s = hass.states[e.entity_id]; if (!s) return;
        const d = e.entity_id.split('.')[0];
        if (d === 'lock') locks.push(e.entity_id);
        else if (d === 'alarm_control_panel') alarm = e.entity_id;
        else if (d === 'binary_sensor') {
          const dc = s.attributes && s.attributes.device_class;
          if (dc === 'door' || dc === 'garage_door') doors.push(e.entity_id);
          else if (dc === 'window') windows.push(e.entity_id);
        } else if (d === 'cover' && s.attributes && s.attributes.device_class === 'garage') {
          doors.push(e.entity_id);
        }
      });
      return { locks, doors, windows, alarm };
    },
    collectBatteries(hass, entities, config) {
      const h = window.L30NEYNHelpers;
      let bats = h.filterAvailable(h.filterByLabels(
        entities.filter(e => {
          if (!e || !e.entity_id || !e.entity_id.startsWith('sensor.')) return false;
          const s = hass.states[e.entity_id]; if (!s) return false;
          return (s.attributes && s.attributes.device_class === 'battery') ||
                 (s.attributes && s.attributes.unit_of_measurement === '%');
        })
      ));
      const critical = [], low = [], good = [];
      bats.forEach(e => {
        const s = hass.states[e.entity_id]; if (!s) return;
        const v = parseFloat(s.state); if (isNaN(v)) return;
        if (v < 20) critical.push(e.entity_id);
        else if (v < 50) low.push(e.entity_id);
        else good.push(e.entity_id);
      });
      return { critical, low, good };
    },
    collectRoomEntities(areaId, hass, entities, devices, config) {
      const h = window.L30NEYNHelpers;
      const deviceAreaMap = h.buildDeviceAreaMap(devices);
      let ae = h.filterAvailable(h.filterByLabels(h.filterByArea(entities, areaId, deviceAreaMap)));
      const areaOptions = (config.areas_options && config.areas_options[areaId]) || {};
      const groupsOptions = areaOptions.groups_options || {};
      const domainGroups = h.groupByDomain(ae);
      const result = {};
      for (const [domain, ents] of domainGroups) {
        const domOpt = groupsOptions[domain] || {};
        let filtered = h.filterByConfigHidden(ents, domOpt.hidden || []);
        filtered = h.sortByOrder(filtered, domOpt.order || []);
        if (filtered.length) result[domain] = filtered.map(e => e.entity_id);
      }
      return result;
    },
  };

  // ─── STATISTICS COLLECTORS ────────────────────────────────────────────────

  window.L30NEYNStatisticsCollectors = {
    collectEnergy(hass, entities, config) {
      const ee = entities.filter(e => {
        if (!e || !e.entity_id) return false;
        const s = hass.states[e.entity_id]; if (!s) return false;
        return (s.attributes && s.attributes.device_class === 'energy') ||
               (s.attributes && s.attributes.unit_of_measurement === 'kWh') ||
               e.entity_id.includes('energy');
      });
      let totalConsumption = 0, totalProduction = 0;
      const consumers = [], producers = [];
      ee.forEach(e => {
        const s = hass.states[e.entity_id];
        if (!s || s.state === 'unavailable' || s.state === 'unknown') return;
        const v = parseFloat(s.state); if (isNaN(v)) return;
        const name = (s.attributes && s.attributes.friendly_name) || e.entity_id;
        const unit = (s.attributes && s.attributes.unit_of_measurement) || 'kWh';
        if (e.entity_id.includes('solar') || e.entity_id.includes('production')) {
          totalProduction += v;
          producers.push({ entity_id: e.entity_id, name, value: v, unit });
        } else {
          totalConsumption += v;
          consumers.push({ entity_id: e.entity_id, name, value: v, unit });
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
    collectClimate(hass, entities, areas, config) {
      const safeAreas = areas || [];
      const tempSensors = entities.filter(e => {
        if (!e || !e.entity_id) return false;
        const s = hass.states[e.entity_id]; if (!s || !s.attributes) return false;
        return s.attributes.device_class === 'temperature' ||
               s.attributes.unit_of_measurement === '°C' ||
               s.attributes.unit_of_measurement === '°F';
      });
      const humSensors = entities.filter(e => {
        if (!e || !e.entity_id) return false;
        const s = hass.states[e.entity_id]; if (!s || !s.attributes) return false;
        return s.attributes.device_class === 'humidity' || s.attributes.unit_of_measurement === '%';
      });
      let tSum = 0, tCount = 0, hSum = 0, hCount = 0;
      const roomTemps = [], roomHumidity = [];
      tempSensors.forEach(e => {
        const s = hass.states[e.entity_id];
        if (!s || s.state === 'unavailable' || s.state === 'unknown') return;
        const v = parseFloat(s.state); if (isNaN(v)) return;
        tSum += v; tCount++;
        const area = safeAreas.find(a => a.area_id === e.area_id);
        if (area) roomTemps.push({ area: area.name, value: v, unit: (s.attributes && s.attributes.unit_of_measurement) || '°C' });
      });
      humSensors.forEach(e => {
        const s = hass.states[e.entity_id];
        if (!s || s.state === 'unavailable' || s.state === 'unknown') return;
        const v = parseFloat(s.state); if (isNaN(v)) return;
        hSum += v; hCount++;
        const area = safeAreas.find(a => a.area_id === e.area_id);
        if (area) roomHumidity.push({ area: area.name, value: v, unit: '%' });
      });
      return {
        avgTemperature: tCount > 0 ? (tSum / tCount).toFixed(1) : 'N/A',
        avgHumidity: hCount > 0 ? (hSum / hCount).toFixed(0) : 'N/A',
        minTemperature: roomTemps.length ? Math.min(...roomTemps.map(r => r.value)).toFixed(1) : 'N/A',
        maxTemperature: roomTemps.length ? Math.max(...roomTemps.map(r => r.value)).toFixed(1) : 'N/A',
        roomTemps: roomTemps.sort((a, b) => b.value - a.value),
        roomHumidity: roomHumidity.sort((a, b) => b.value - a.value),
      };
    },
    collectSystemHealth(hass, entities, config) {
      const stateKeys = Object.keys(hass.states || {});
      const total = stateKeys.length;
      if (total === 0) return { totalEntities: 0, totalDevices: 0, unavailableCount: 0, unknownCount: 0, healthPercentage: '100.0', updatesAvailable: 0, updateEntities: [], automations: { total: 0, active: 0 } };
      let unavail = 0, unknown = 0;
      Object.values(hass.states).forEach(s => {
        if (s.state === 'unavailable') unavail++;
        if (s.state === 'unknown') unknown++;
      });
      const totalDevices = entities.filter(e => e && e.device_id)
        .map(e => e.device_id)
        .filter((id, i, s) => s.indexOf(id) === i).length;
      const updates = stateKeys.filter(id => id.startsWith('update.'))
        .map(id => hass.states[id])
        .filter(s => s && s.state === 'on');
      const automations = stateKeys.filter(id => id.startsWith('automation.'));
      const activeAutomations = automations.filter(id => hass.states[id] && hass.states[id].state === 'on');
      return {
        totalEntities: total, totalDevices, unavailableCount: unavail, unknownCount: unknown,
        healthPercentage: ((total - unavail - unknown) / total * 100).toFixed(1),
        updatesAvailable: updates.length,
        updateEntities: updates.map(s => ({
          entity_id: s.entity_id,
          name: (s.attributes && s.attributes.friendly_name) || s.entity_id,
          version: s.attributes && s.attributes.latest_version,
        })),
        automations: { total: automations.length, active: activeAutomations.length },
      };
    },
    collectNetwork(hass, entities, config) {
      const ne = entities.filter(e =>
        e && e.entity_id && (
          e.entity_id.includes('network') ||
          e.entity_id.includes('bandwidth') ||
          e.entity_id.includes('speedtest') ||
          e.entity_id.includes('ping')
        )
      );
      const stats = { download: null, upload: null, ping: null };
      ne.forEach(e => {
        const s = hass.states[e.entity_id];
        if (!s || s.state === 'unavailable') return;
        const unit = (s.attributes && s.attributes.unit_of_measurement) || '';
        if (e.entity_id.includes('download')) stats.download = { value: parseFloat(s.state), unit: unit || 'Mbit/s' };
        else if (e.entity_id.includes('upload')) stats.upload = { value: parseFloat(s.state), unit: unit || 'Mbit/s' };
        else if (e.entity_id.includes('ping')) stats.ping = { value: parseFloat(s.state), unit: unit || 'ms' };
      });
      return stats;
    },
  };

  // ─── STATISTICS CARD BUILDERS ─────────────────────────────────────────────

  window.L30NEYNStatisticsCardBuilders = {
    getTemperatureColor(t) {
      if (isNaN(t) || t === null) return 'grey';
      if (t < 18) return 'blue'; if (t < 22) return 'green'; if (t < 25) return 'orange'; return 'red';
    },
    getHumidityColor(h) {
      if (isNaN(h) || h === null) return 'grey';
      if (h < 30) return 'orange'; if (h < 60) return 'green'; if (h < 70) return 'orange'; return 'red';
    },
    buildEnergyCard(stats, options = {}) {
      const entities = [{ type: 'custom:mushroom-chips-card', chips: [
        { type: 'template', icon: 'mdi:lightning-bolt', content: `${stats.totalConsumption} kWh`, icon_color: 'orange' },
        { type: 'template', icon: 'mdi:solar-power', content: `${stats.totalProduction} kWh`, icon_color: 'green' },
        { type: 'template', icon: 'mdi:transmission-tower', content: `${stats.netConsumption} kWh`, icon_color: parseFloat(stats.netConsumption) > 0 ? 'red' : 'blue' },
      ] }];
      if (stats.consumers.length) {
        entities.push({ type: 'section', label: 'Top Verbraucher' });
        stats.consumers.forEach(c => entities.push({ entity: c.entity_id, secondary_info: `${c.value.toFixed(2)} ${c.unit}` }));
      }
      return { type: 'entities', title: 'Energieübersicht', icon: 'mdi:lightning-bolt', entities, ...options };
    },
    buildClimateCard(stats, options = {}) {
      const entities = [{ type: 'custom:mushroom-chips-card', chips: [
        { type: 'template', icon: 'mdi:thermometer', content: `⌀ ${stats.avgTemperature}°C`, icon_color: this.getTemperatureColor(parseFloat(stats.avgTemperature)) },
        { type: 'template', icon: 'mdi:water-percent', content: `⌀ ${stats.avgHumidity}%`, icon_color: this.getHumidityColor(parseFloat(stats.avgHumidity)) },
      ] }];
      if (stats.roomTemps.length) {
        entities.push({ type: 'section', label: 'Räume' });
        stats.roomTemps.slice(0, 5).forEach(r => entities.push({
          type: 'custom:mushroom-entity-card', name: r.area, icon: 'mdi:home-thermometer',
          primary_info: 'name', secondary_info: `${r.value.toFixed(1)}${r.unit}`,
        }));
      }
      return { type: 'entities', title: 'Klimaübersicht', icon: 'mdi:home-thermometer-outline', entities, ...options };
    },
    buildSystemHealthCard(stats, options = {}) {
      const hp = parseFloat(stats.healthPercentage);
      const entities = [
        { type: 'custom:mushroom-template-card', primary: 'Systemgesundheit', secondary: `${stats.healthPercentage}% verfügbar`, icon: 'mdi:heart-pulse', icon_color: hp > 95 ? 'green' : hp > 85 ? 'orange' : 'red', layout: 'horizontal' },
        { type: 'section', label: 'Statistiken' },
        { type: 'attribute', entity: 'sun.sun', attribute: 'elevation', name: 'Entitäten', format: 'total', suffix: ` ${stats.totalEntities}`, icon: 'mdi:label' },
        { type: 'attribute', entity: 'sun.sun', attribute: 'elevation', name: 'Geräte', format: 'total', suffix: ` ${stats.totalDevices}`, icon: 'mdi:devices' },
      ];
      if (stats.unavailableCount > 0) entities.push({ type: 'attribute', entity: 'sun.sun', attribute: 'elevation', name: 'Nicht verfügbar', format: 'total', suffix: ` ${stats.unavailableCount}`, icon: 'mdi:alert-circle' });
      entities.push(
        { type: 'section', label: 'Automatisierungen' },
        { type: 'attribute', entity: 'sun.sun', attribute: 'elevation', name: 'Aktiv', format: 'total', suffix: ` ${stats.automations.active} / ${stats.automations.total}`, icon: 'mdi:robot' }
      );
      if (stats.updatesAvailable > 0) {
        entities.push({ type: 'section', label: `Updates verfügbar (${stats.updatesAvailable})` });
        stats.updateEntities.slice(0, 3).forEach(u => entities.push({ entity: u.entity_id, secondary_info: u.version }));
      }
      return { type: 'entities', title: 'Systemstatus', icon: 'mdi:server', entities, ...options };
    },
    buildNetworkCard(stats, options = {}) {
      if (!stats.download && !stats.upload && !stats.ping) return null;
      const chips = [];
      if (stats.download) chips.push({ type: 'template', icon: 'mdi:download', content: `${stats.download.value.toFixed(1)} ${stats.download.unit}`, icon_color: 'blue' });
      if (stats.upload) chips.push({ type: 'template', icon: 'mdi:upload', content: `${stats.upload.value.toFixed(1)} ${stats.upload.unit}`, icon_color: 'green' });
      if (stats.ping) chips.push({ type: 'template', icon: 'mdi:swap-horizontal', content: `${stats.ping.value.toFixed(0)} ${stats.ping.unit}`, icon_color: stats.ping.value < 50 ? 'green' : 'orange' });
      return { type: 'custom:mushroom-chips-card', chips, ...options };
    },
  };

  // ─── THEME MANAGER ────────────────────────────────────────────────────────

  window.L30NEYNThemeManager = {
    currentTheme: { mode: 'auto', colorScheme: 'default' },
    init(config = {}) {
      this.currentTheme = {
        mode: config.theme_mode || this._load('theme_mode') || 'auto',
        colorScheme: config.color_scheme || this._load('color_scheme') || 'default',
      };
      this.applyTheme();
      if (this.currentTheme.mode === 'auto') this._watchSystem();
    },
    applyTheme(hass, config) {
      try {
        const root = document.documentElement;
        const mode = (config && config.theme_mode) ? config.theme_mode : this.currentTheme.mode;
        root.setAttribute('data-theme', mode === 'auto'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : mode);
        const scheme = (config && config.color_scheme) ? config.color_scheme : this.currentTheme.colorScheme;
        if (scheme && scheme !== 'default') root.setAttribute('data-color-scheme', scheme);
        else root.removeAttribute('data-color-scheme');
      } catch (e) { /* silent */ }
    },
    setMode(mode) {
      if (!['auto','light','dark'].includes(mode)) return;
      this.currentTheme.mode = mode; this._save('theme_mode', mode); this.applyTheme();
      if (mode === 'auto') this._watchSystem();
    },
    setColorScheme(scheme) { this.currentTheme.colorScheme = scheme; this._save('color_scheme', scheme); this.applyTheme(); },
    getTheme() { return { ...this.currentTheme }; },
    getAvailableColorSchemes() {
      return [
        { id: 'default', name: 'Standard', icon: 'mdi:palette' },
        { id: 'blue', name: 'Blau', icon: 'mdi:palette', color: '#2196f3' },
        { id: 'green', name: 'Grün', icon: 'mdi:palette', color: '#4caf50' },
        { id: 'purple', name: 'Lila', icon: 'mdi:palette', color: '#9c27b0' },
        { id: 'red', name: 'Rot', icon: 'mdi:palette', color: '#f44336' },
        { id: 'orange', name: 'Orange', icon: 'mdi:palette', color: '#ff9800' },
        { id: 'teal', name: 'Türkis', icon: 'mdi:palette', color: '#009688' },
      ];
    },
    _save(k, v) { try { localStorage.setItem(`l30neyn_${k}`, v); } catch (e) {} },
    _load(k) { try { return localStorage.getItem(`l30neyn_${k}`); } catch (e) { return null; } },
    _watchSystem() {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (this._mql) { try { mq.removeEventListener('change', this._mql); } catch(e) {} }
      this._mql = () => { if (this.currentTheme.mode === 'auto') this.applyTheme(); };
      mq.addEventListener('change', this._mql);
    },
  };

  // ─── CONFIG MANAGER ───────────────────────────────────────────────────────

  window.L30NEYNConfigManager = {
    defaultConfig: {
      theme_mode: 'auto', color_scheme: 'default',
      show_welcome: true, show_areas: true, show_security: true,
      show_light_summary: true, show_battery_status: true,
      weather_entity: null,
      show_energy_stats: true, show_climate_stats: true,
      show_system_health: true, show_network_stats: false,
      debug_mode: false, areas_options: {},
    },
    async loadConfig(hass) {
      try {
        const inp = await this._fromInputHelpers(hass);
        return { ...this.defaultConfig, ...inp };
      } catch (e) {
        return { ...this.defaultConfig };
      }
    },
    async _fromInputHelpers(hass) {
      const c = {};
      const ibv = (id, def) => { const s = hass.states[id]; return s ? s.state === 'on' : def; };
      const isv = (id) => { const s = hass.states[id]; return s ? s.state : null; };
      const itv = (id) => { const s = hass.states[id]; return (s && s.state) ? s.state : null; };
      c.theme_mode = isv('input_select.ha_custom_theme_mode') || 'auto';
      c.color_scheme = isv('input_select.ha_custom_color_scheme') || 'default';
      c.show_welcome = ibv('input_boolean.ha_custom_show_welcome', true);
      c.show_areas = ibv('input_boolean.ha_custom_show_areas', true);
      c.show_security = ibv('input_boolean.ha_custom_show_security', true);
      c.show_light_summary = ibv('input_boolean.ha_custom_show_light_summary', true);
      c.show_battery_status = ibv('input_boolean.ha_custom_show_battery_status', true);
      c.weather_entity = itv('input_text.ha_custom_weather_entity');
      c.show_energy_stats = ibv('input_boolean.ha_custom_show_energy_stats', true);
      c.show_climate_stats = ibv('input_boolean.ha_custom_show_climate_stats', true);
      c.show_system_health = ibv('input_boolean.ha_custom_show_system_health', true);
      c.show_network_stats = ibv('input_boolean.ha_custom_show_network_stats', false);
      c.debug_mode = ibv('input_boolean.ha_custom_debug_mode', false);
      return c;
    },
  };

  // ─── OVERVIEW VIEW ────────────────────────────────────────────────────────

  window.L30NEYNOverviewView = {
    generate(hass, config, registry) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const collectors = window.L30NEYNDataCollectors;
        const builders = window.L30NEYNCardBuilders;
        const cards = [];
        if (config.show_welcome !== false) {
          cards.push({ type: 'markdown', content: `# Willkommen\n\n${this._greeting()}` });
        }
        const weatherEntity = config.weather_entity ||
          Object.keys(hass.states || {}).find(id => id && id.startsWith('weather.'));
        if (weatherEntity) cards.push(builders.buildWeatherCard(weatherEntity));
        if (config.show_areas !== false) {
          const areaCards = this._areaCards(areas, hass, entities, devices, config);
          if (areaCards.length) cards.push({ type: 'grid', cards: areaCards, columns: 3 });
        }
        if (config.show_security !== false) {
          const sec = collectors.collectSecurity(hass, entities, config);
          if (sec.locks.length || sec.doors.length || sec.windows.length || sec.alarm) {
            cards.push(builders.buildSecurityCard(sec));
          }
        }
        if (config.show_light_summary !== false) {
          const lights = collectors.collectLights(hass, entities, config);
          cards.push({ type: 'entities', title: 'Beleuchtung', entities: [
            { type: 'attribute', entity: 'sun.sun', attribute: 'next_rising', name: 'Lichter an', format: 'total', suffix: ` (${lights.on.length})` },
            { type: 'attribute', entity: 'sun.sun', attribute: 'next_setting', name: 'Lichter aus', format: 'total', suffix: ` (${lights.off.length})` },
          ] });
        }
        if (config.show_battery_status !== false) {
          const bats = collectors.collectBatteries(hass, entities, config);
          if (bats.critical.length || bats.low.length) {
            cards.push(builders.buildBatteryCard(bats.critical, bats.low));
          }
        }
        if (!cards.length) cards.push({ type: 'markdown', content: 'Dashboard wird geladen...' });
        return { title: config.title || 'Übersicht', path: 'overview', icon: config.icon || 'mdi:home', cards };
      } catch (e) {
        console.error('[L30NEYN] OverviewView error:', e);
        return { title: 'Übersicht', path: 'overview', icon: 'mdi:home', cards: [{ type: 'markdown', content: `Fehler beim Laden: ${e.message}` }] };
      }
    },
    _areaCards(areas, hass, entities, devices, config) {
      const h = window.L30NEYNHelpers;
      const deviceAreaMap = h.buildDeviceAreaMap(devices);
      return (areas || []).filter(a => a && (!a.labels || !a.labels.includes('no_dboard'))).map(area => {
        let ae = h.filterAvailable(h.filterByLabels(h.filterByArea(entities, area.area_id, deviceAreaMap)));
        const lights = ae.filter(e => e && e.entity_id && e.entity_id.startsWith('light.'));
        return {
          type: 'button', name: area.name, icon: area.icon || 'mdi:home',
          tap_action: { action: 'navigate', navigation_path: `/lovelace/${area.area_id}` },
          entity: lights[0] ? lights[0].entity_id : undefined,
        };
      });
    },
    _greeting() {
      const h = new Date().getHours();
      if (h < 6) return 'Gute Nacht';
      if (h < 12) return 'Guten Morgen';
      if (h < 18) return 'Guten Tag';
      return 'Guten Abend';
    },
  };

  // ─── ROOM VIEW ────────────────────────────────────────────────────────────

  window.L30NEYNRoomView = {
    DOMAIN_ORDER: ['light','cover','climate','fan','switch','media_player','sensor','binary_sensor','camera'],
    DOMAIN_TITLES: {
      light: 'Beleuchtung', cover: 'Rollos & Vorhänge', climate: 'Klima',
      fan: 'Ventilatoren', switch: 'Schalter', media_player: 'Medien',
      sensor: 'Sensoren', binary_sensor: 'Status', camera: 'Kameras',
    },
    generate(areaId, hass, config, registry) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const area = areas.find(a => a && a.area_id === areaId);
        if (!area) return { title: areaId || 'Raum', path: areaId || 'unknown', cards: [{ type: 'markdown', content: 'Raum nicht gefunden.' }] };
        const collectors = window.L30NEYNDataCollectors;
        const builders = window.L30NEYNCardBuilders;
        const roomEntities = collectors.collectRoomEntities(areaId, hass, entities, devices, config);
        const cards = [];
        if (roomEntities.light && roomEntities.light.length > 1) cards.push(builders.buildGroupControlCard(roomEntities.light, 'light'));
        if (roomEntities.cover && roomEntities.cover.length > 1) cards.push(builders.buildGroupControlCard(roomEntities.cover, 'cover'));
        for (const domain of this.DOMAIN_ORDER) {
          if (!roomEntities[domain] || !roomEntities[domain].length) continue;
          const c = this._domainCard(domain, roomEntities[domain], hass, config);
          if (c) cards.push(c);
        }
        for (const domain in roomEntities) {
          if (this.DOMAIN_ORDER.includes(domain)) continue;
          const c = this._domainCard(domain, roomEntities[domain], hass, config);
          if (c) cards.push(c);
        }
        return {
          title: area.name, path: areaId, icon: area.icon || 'mdi:home',
          cards: cards.length ? cards : [{ type: 'markdown', content: 'Keine Geräte in diesem Raum.' }],
        };
      } catch (e) {
        console.error(`[L30NEYN] RoomView error for ${areaId}:`, e);
        return { title: areaId || 'Raum', path: areaId || 'unknown', icon: 'mdi:home', cards: [{ type: 'markdown', content: `Fehler: ${e.message}` }] };
      }
    },
    _domainCard(domain, entityIds, hass, config) {
      const builders = window.L30NEYNCardBuilders;
      const title = this.DOMAIN_TITLES[domain] || domain.replace('_', ' ');
      if (domain === 'sensor' || domain === 'binary_sensor') {
        const relevant = (entityIds || []).filter(id => {
          if (!id) return false;
          const s = hass.states[id];
          if (!s || !s.attributes) return false;
          return ['temperature','humidity','illuminance','motion','occupancy','door','window']
            .includes(s.attributes.device_class);
        });
        if (!relevant.length) return null;
        return builders.buildSensorCard(relevant, { title });
      }
      return builders.buildEntitiesCard(entityIds || [], { title });
    },
  };

  // ─── STATISTICS VIEW ──────────────────────────────────────────────────────

  window.L30NEYNStatisticsView = {
    generate(hass, config, registry) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const collectors = window.L30NEYNStatisticsCollectors;
        const builders = window.L30NEYNStatisticsCardBuilders;
        const cards = [{ type: 'markdown', content: '# Statistiken\n\nÜberblick über Energie, Klima und System.' }];
        if (config.show_energy_stats !== false) {
          try { const c = builders.buildEnergyCard(collectors.collectEnergy(hass, entities, config)); if (c) cards.push(c); } catch(e) { console.warn('[L30NEYN] Energy stats error:', e); }
        }
        if (config.show_climate_stats !== false) {
          try { const c = builders.buildClimateCard(collectors.collectClimate(hass, entities, areas, config)); if (c) cards.push(c); } catch(e) { console.warn('[L30NEYN] Climate stats error:', e); }
        }
        if (config.show_system_health !== false) {
          try { const c = builders.buildSystemHealthCard(collectors.collectSystemHealth(hass, entities, config)); if (c) cards.push(c); } catch(e) { console.warn('[L30NEYN] System health error:', e); }
        }
        if (config.show_network_stats === true) {
          try { const c = builders.buildNetworkCard(collectors.collectNetwork(hass, entities, config)); if (c) cards.push(c); } catch(e) { console.warn('[L30NEYN] Network stats error:', e); }
        }
        if (cards.length === 1) cards.push({ type: 'markdown', content: 'Keine Statistiken verfügbar.' });
        return { title: 'Statistiken', path: 'statistics', icon: 'mdi:chart-box', cards };
      } catch (e) {
        console.error('[L30NEYN] StatisticsView error:', e);
        return { title: 'Statistiken', path: 'statistics', icon: 'mdi:chart-box', cards: [{ type: 'markdown', content: `Fehler: ${e.message}` }] };
      }
    },
  };

  // ─── SETTINGS VIEW ────────────────────────────────────────────────────────

  window.L30NEYNSettingsView = {
    generate(hass, config, registry) {
      const { areas = [] } = registry;
      const cards = [
        { type: 'markdown', content: '# Dashboard-Einstellungen\n\nHier kannst du dein Dashboard anpassen.\n\n**Tipp:** Verwende das Label `no_dboard` um Entitäten oder Räume auszublenden.' },
        { type: 'entities', title: 'Design & Theme', icon: 'mdi:palette', entities: [
          { type: 'custom:mushroom-select-card', entity: 'input_select.ha_custom_theme_mode', name: 'Theme-Modus', icon: 'mdi:theme-light-dark' },
          { type: 'custom:mushroom-select-card', entity: 'input_select.ha_custom_color_scheme', name: 'Farbschema', icon: 'mdi:palette' },
        ] },
        { type: 'entities', title: 'Übersichtsseite', icon: 'mdi:home', entities: [
          { entity: 'input_boolean.ha_custom_show_welcome', name: 'Begrüßung anzeigen' },
          { entity: 'input_boolean.ha_custom_show_areas', name: 'Raumübersicht anzeigen' },
          { entity: 'input_boolean.ha_custom_show_security', name: 'Sicherheitsstatus anzeigen' },
          { entity: 'input_boolean.ha_custom_show_light_summary', name: 'Licht-Zusammenfassung anzeigen' },
          { entity: 'input_boolean.ha_custom_show_battery_status', name: 'Batteriestatus anzeigen' },
        ] },
        { type: 'entities', title: 'Statistiken', icon: 'mdi:chart-line', entities: [
          { entity: 'input_boolean.ha_custom_show_energy_stats', name: 'Energie-Statistiken' },
          { entity: 'input_boolean.ha_custom_show_climate_stats', name: 'Klima-Statistiken' },
          { entity: 'input_boolean.ha_custom_show_system_health', name: 'System-Gesundheit' },
          { entity: 'input_boolean.ha_custom_show_network_stats', name: 'Netzwerk-Statistiken' },
        ] },
        this._areaConfigCard(areas, config),
        { type: 'entities', title: 'Erweitert', icon: 'mdi:cog-outline', entities: [
          { entity: 'input_boolean.ha_custom_debug_mode', name: 'Debug-Modus', icon: 'mdi:bug' },
        ] },
      ];
      return { title: 'Einstellungen', path: 'settings', icon: 'mdi:cog', cards };
    },
    _areaConfigCard(areas, config) {
      const entities = [{ type: 'section', label: 'Klicke auf einen Raum zum Konfigurieren' }];
      (areas || []).filter(a => a && (!a.labels || !a.labels.includes('no_dboard'))).forEach(a =>
        entities.push({
          type: 'custom:mushroom-entity-card', name: a.name, icon: a.icon || 'mdi:home',
          tap_action: { action: 'navigate', navigation_path: `/lovelace/settings-area-${a.area_id}` },
          icon_color: 'blue',
        })
      );
      return { type: 'entities', title: 'Raum-Konfiguration', icon: 'mdi:home-edit', entities };
    },
    generateAreaSettings(areaId, hass, config, registry) {
      const { areas = [] } = registry;
      const area = areas.find(a => a && a.area_id === areaId);
      if (!area) return { title: 'Fehler', path: `settings-area-${areaId}`, cards: [{ type: 'markdown', content: 'Raum nicht gefunden.' }] };
      const cards = [{ type: 'markdown', content: `# ${area.name}\n\nKonfiguriere die Geräteanzeige für diesen Raum.` }];
      ['light','cover','climate','switch','sensor'].forEach(domain => {
        const titles = { light: 'Beleuchtung', cover: 'Rollos', climate: 'Klima', switch: 'Schalter', sensor: 'Sensoren' };
        cards.push({ type: 'entities', title: titles[domain] || domain, entities: [
          { entity: `input_boolean.ha_custom_${areaId}_${domain}_enabled`, name: 'Anzeigen' },
        ] });
      });
      return { title: `${area.name} - Einstellungen`, path: `settings-area-${areaId}`, icon: area.icon || 'mdi:home', cards };
    },
  };

  // ─── MAIN STRATEGY ────────────────────────────────────────────────────────

  class L30NEYNDashboardStrategy {
    static async generateDashboard(info) {
      try {
        const { hass, config } = info;
        const strategyConfig = await window.L30NEYNConfigManager.loadConfig(hass);
        const mergedConfig = { ...config, ...strategyConfig };
        try { window.L30NEYNThemeManager.applyTheme(hass, mergedConfig); } catch(e) {}
        const registry = await this._fetchRegistries(hass);
        const views = await this._generateViews(hass, mergedConfig, registry);
        return { views };
      } catch (e) {
        console.error('[L30NEYN] generateDashboard error:', e);
        return { views: [{ title: 'Fehler', path: 'overview', icon: 'mdi:alert', cards: [{ type: 'markdown', content: `# Fehler\n\n${e.message}` }] }] };
      }
    }

    static async generateView(info) {
      try {
        const { hass, config, view } = info;
        const strategyConfig = await window.L30NEYNConfigManager.loadConfig(hass);
        const mergedConfig = { ...config, ...strategyConfig };
        const registry = await this._fetchRegistries(hass);
        const path = view && view.path ? view.path : 'overview';
        if (path === 'overview') return window.L30NEYNOverviewView.generate(hass, mergedConfig, registry);
        if (path === 'settings') return window.L30NEYNSettingsView.generate(hass, mergedConfig, registry);
        if (path === 'statistics') return window.L30NEYNStatisticsView.generate(hass, mergedConfig, registry);
        if (path.startsWith('settings-area-')) return window.L30NEYNSettingsView.generateAreaSettings(path.replace('settings-area-', ''), hass, mergedConfig, registry);
        return window.L30NEYNRoomView.generate(path, hass, mergedConfig, registry);
      } catch (e) {
        console.error('[L30NEYN] generateView error:', e);
        return { title: 'Fehler', path: (info.view && info.view.path) || 'error', icon: 'mdi:alert', cards: [{ type: 'markdown', content: `# Fehler\n\n${e.message}` }] };
      }
    }

    static async _fetchRegistries(hass) {
      try {
        const [entities, devices, areas] = await Promise.all([
          hass.callWS({ type: 'config/entity_registry/list' }).catch(() => []),
          hass.callWS({ type: 'config/device_registry/list' }).catch(() => []),
          hass.callWS({ type: 'config/area_registry/list' }).catch(() => []),
        ]);
        return {
          entities: Array.isArray(entities) ? entities : [],
          devices: Array.isArray(devices) ? devices : [],
          areas: Array.isArray(areas) ? areas : [],
        };
      } catch (e) {
        console.error('[L30NEYN] Registry fetch failed:', e);
        return { entities: [], devices: [], areas: [] };
      }
    }

    static async _generateViews(hass, config, registry) {
      const views = [];
      try { views.push(window.L30NEYNOverviewView.generate(hass, config, registry)); } catch(e) { console.error('[L30NEYN] Overview error:', e); }
      try { if (window.L30NEYNStatisticsView) views.push(window.L30NEYNStatisticsView.generate(hass, config, registry)); } catch(e) {}
      for (const area of (registry.areas || [])) {
        if (!area || !area.area_id) continue;
        if (area.labels && area.labels.includes('no_dboard')) continue;
        try { views.push(window.L30NEYNRoomView.generate(area.area_id, hass, config, registry)); } catch(e) { console.error(`[L30NEYN] Room ${area.area_id} error:`, e); }
      }
      try { if (window.L30NEYNSettingsView) views.push(window.L30NEYNSettingsView.generate(hass, config, registry)); } catch(e) {}
      if (!views.length) views.push({ title: 'Übersicht', path: 'overview', icon: 'mdi:home', cards: [{ type: 'markdown', content: 'Dashboard wird geladen...' }] });
      return views;
    }
  }

  // ─── REGISTER CUSTOM ELEMENT ──────────────────────────────────────────────
  // customElements name: ll-strategy-dashboard-l30neyn
  // YAML usage:         strategy: { type: custom:l30neyn }

  customElements.define('ll-strategy-dashboard-l30neyn', class extends HTMLElement {
    static async generate(info) { return L30NEYNDashboardStrategy.generateDashboard(info); }
    static async generateView(info) { return L30NEYNDashboardStrategy.generateView(info); }
  });

  console.info(
    '%c L30NEYN-DASHBOARD %c v' + VERSION + ' ',
    'background: #41BDF5; color: #fff; font-weight: bold; padding: 3px 5px;',
    'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;'
  );

})();

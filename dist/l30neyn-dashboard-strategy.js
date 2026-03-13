/**
 * L30NEYN Dashboard Strategy
 * @version 1.6.1
 * @license MIT
 */

(function () {
  'use strict';

  const VERSION = '1.6.1';
  console.info('[L30NEYN] Loading dashboard strategy v' + VERSION);

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 1 — WEBSOCKET HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  const callWS = async (hass, message) => {
    if (typeof hass.callWS === 'function') return await hass.callWS(message);
    if (hass.connection?.sendMessagePromise) return await hass.connection.sendMessagePromise(message);
    throw new Error('No WebSocket method available on hass object');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 2 — REGISTRY DATA LOADER
  // ═══════════════════════════════════════════════════════════════════════════

  const loadRegistryData = async (hass) => {
    if (!hass) throw new Error('HASS object is null or undefined');
    const cachedAreas    = hass.areas    ? Object.values(hass.areas)    : [];
    const cachedDevices  = hass.devices  ? Object.values(hass.devices)  : [];
    const cachedEntities = hass.entities ? Object.values(hass.entities) : [];
    if (cachedAreas.length > 0 || cachedDevices.length > 0 || cachedEntities.length > 0) {
      return { areas: cachedAreas, devices: cachedDevices, entities: cachedEntities, source: 'cached' };
    }
    try {
      const [areas, devices, entities] = await Promise.all([
        callWS(hass, { type: 'config/area_registry/list' }),
        callWS(hass, { type: 'config/device_registry/list' }),
        callWS(hass, { type: 'config/entity_registry/list' }),
      ]);
      return { areas: areas || [], devices: devices || [], entities: entities || [], source: 'websocket' };
    } catch (e) {
      return { areas: [], devices: [], entities: [], source: 'error', error: e.message };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 3 — DASHBOARD CONTEXT RESOLVER
  // ═══════════════════════════════════════════════════════════════════════════

  const DashboardContextResolver = {
    async resolve(hass, config) {
      const manual = config?.navigation?.dashboard_url_path;
      if (manual) {
        const clean = String(manual).replace(/^\/+|\/+$/g, '');
        return { source: 'config', url_path: clean };
      }
      try {
        const dashboards = await callWS(hass, { type: 'lovelace/dashboards/list' });
        if (Array.isArray(dashboards)) {
          const currentPath = window.location.pathname;
          const match = dashboards.find((d) => {
            if (!d?.url_path) return false;
            const base = '/' + d.url_path;
            return currentPath === base || currentPath.startsWith(base + '/');
          });
          if (match?.url_path) return { source: 'ui-dashboard', url_path: match.url_path, title: match.title, mode: match.mode };
        }
      } catch (e) {
        console.warn('[L30NEYN] DashboardContext: lovelace/dashboards/list failed:', e.message);
      }
      return { source: 'fallback', url_path: 'lovelace' };
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 4 — DASHBOARD PATH RESOLVER
  // ═══════════════════════════════════════════════════════════════════════════

  const DashboardPathResolver = {
    async resolve(hass, config) {
      const ctx = await DashboardContextResolver.resolve(hass, config);
      return '/' + ctx.url_path;
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 5 — NAVIGATION BUILDER
  // ═══════════════════════════════════════════════════════════════════════════

  const NavigationBuilder = {
    room(basePath, areaId)  { return `${basePath}/${areaId}`; },
    overview(basePath)      { return `${basePath}/overview`; },
    settings(basePath)      { return `${basePath}/settings`; },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 6 — REGISTRY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const RegistryHelpers = {
    filterByLabels: (entities) => entities.filter(e => e?.entity_id && !(e.labels?.includes('no_dboard'))),
    filterByArea(entities, areaId, deviceAreaMap) {
      return entities.filter(e => {
        if (!e?.entity_id) return false;
        if (e.area_id === areaId) return true;
        if (e.device_id) return deviceAreaMap.get(e.device_id) === areaId;
        return false;
      });
    },
    filterAvailable: (entities) => entities.filter(e => e?.entity_id && !e.disabled_by && !e.hidden_by && !e.entity_category),
    filterHidden(entities, hiddenIds = []) {
      const s = new Set(hiddenIds);
      return entities.filter(e => e?.entity_id && !s.has(e.entity_id));
    },
    groupByDomain(entities) {
      const g = new Map();
      entities.forEach(e => {
        if (!e?.entity_id) return;
        const d = e.entity_id.split('.')[0];
        if (!g.has(d)) g.set(d, []);
        g.get(d).push(e);
      });
      return g;
    },
    buildDeviceAreaMap(devices) {
      const m = new Map();
      (devices || []).forEach(d => { if (d?.area_id) m.set(d.id, d.area_id); });
      return m;
    },
    getHiddenEntities: (config, areaId, domain) =>
      config?.areas_options?.[areaId]?.groups_options?.[domain]?.hidden || [],
    filterAreas: (areas) => (areas || []).filter(a => a && !(a.labels?.includes('no_dboard'))),
    getRoomEntities(areaId, entities, devices, config) {
      const deviceAreaMap = RegistryHelpers.buildDeviceAreaMap(devices);
      const ae = RegistryHelpers.filterAvailable(
        RegistryHelpers.filterByLabels(
          RegistryHelpers.filterByArea(entities, areaId, deviceAreaMap)
        )
      );
      const result = {};
      for (const [domain, ents] of RegistryHelpers.groupByDomain(ae)) {
        const hidden   = RegistryHelpers.getHiddenEntities(config, areaId, domain);
        const filtered = RegistryHelpers.filterHidden(ents, hidden);
        if (filtered.length) result[domain] = filtered.map(e => e.entity_id);
      }
      return result;
    },
  };
  const R = RegistryHelpers;

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 7 — DATA COLLECTORS
  // ═══════════════════════════════════════════════════════════════════════════

  const Collectors = {
    collectRoomEntities(areaId, hass, entities, devices, config) {
      return R.getRoomEntities(areaId, entities, devices, config);
    },
    collectSecurity(hass, entities) {
      const DOMAINS = new Set(['lock', 'binary_sensor', 'alarm_control_panel']);
      const sec = R.filterAvailable(R.filterByLabels(
        entities.filter(e => e?.entity_id && DOMAINS.has(e.entity_id.split('.')[0]))
      ));
      const locks = [], doors = [], windows = []; let alarm = null;
      sec.forEach(e => {
        const s = hass.states[e.entity_id]; if (!s) return;
        const d = e.entity_id.split('.')[0];
        if      (d === 'lock')                locks.push(e.entity_id);
        else if (d === 'alarm_control_panel') alarm = e.entity_id;
        else if (d === 'binary_sensor') {
          const dc = s.attributes?.device_class;
          if      (dc === 'door' || dc === 'garage_door') doors.push(e.entity_id);
          else if (dc === 'window')                       windows.push(e.entity_id);
        }
      });
      return { locks, doors, windows, alarm };
    },
    collectBatteries(hass, entities) {
      const bats = R.filterAvailable(R.filterByLabels(entities.filter(e => {
        if (!e?.entity_id?.startsWith('sensor.')) return false;
        const s = hass.states[e.entity_id]; if (!s) return false;
        return s.attributes?.device_class === 'battery';
      })));
      const critical = [], low = [];
      bats.forEach(e => {
        const s = hass.states[e.entity_id]; if (!s) return;
        const v = parseFloat(s.state); if (isNaN(v)) return;
        if      (v < 20) critical.push(e.entity_id);
        else if (v < 50) low.push(e.entity_id);
      });
      return { critical, low };
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 8 — CARD BUILDERS (Mushroom)
  // ═══════════════════════════════════════════════════════════════════════════

  const Cards = {
    light:       (id) => ({ type: 'custom:mushroom-light-card',        entity: id, show_brightness_control: true, show_color_control: true, show_color_temp_control: true, collapsible_controls: true, fill_container: false }),
    cover:       (id) => ({ type: 'custom:mushroom-cover-card',        entity: id, show_position_control: true, show_tilt_position_control: false, show_buttons_control: true, fill_container: false }),
    climate:     (id) => ({ type: 'custom:mushroom-climate-card',      entity: id, show_temperature_control: true, collapsible_controls: true, fill_container: false }),
    fan:         (id) => ({ type: 'custom:mushroom-fan-card',          entity: id, show_percentage_control: true, show_oscillate_control: true, collapsible_controls: true, fill_container: false }),
    mediaPlayer: (id) => ({ type: 'custom:mushroom-media-player-card', entity: id, use_media_info: true, show_volume_level: true, media_controls: ['on_off','play_pause','previous','next'], volume_controls: ['volume_mute','volume_set','volume_buttons'], collapsible_controls: true, fill_container: false }),
    entity:      (id, opts = {}) => ({ type: 'custom:mushroom-entity-card', entity: id, fill_container: false, ...opts }),
    section:     (label) => ({ type: 'custom:mushroom-title-card', title: label, subtitle: '' }),
    weather:     (entity) => ({ type: 'weather-forecast', entity, show_forecast: true }),
    error(error, details = '') {
      return { type: 'markdown', content: `# \u26a0\ufe0f Dashboard Fehler\n\n**${error}**\n\n\`\`\`\n${details}\n\`\`\`` };
    },
    roomButton(area, basePath, lightEntity) {
      return {
        type: 'custom:mushroom-template-card',
        primary: area.name, icon: area.icon || 'mdi:home',
        icon_color: lightEntity ? '{{ "amber" if is_state("' + lightEntity + '", "on") else "grey" }}' : 'grey',
        tap_action: { action: 'navigate', navigation_path: NavigationBuilder.room(basePath, area.area_id) },
        fill_container: false,
      };
    },
    groupControl(entityIds, domain) {
      const cfg = {
        light: [{ primary: 'Alle an',     icon: 'mdi:lightbulb-group',     icon_color: 'amber',     service: 'light.turn_on'  },
                { primary: 'Alle aus',    icon: 'mdi:lightbulb-group-off', icon_color: 'grey',      service: 'light.turn_off' }],
        cover: [{ primary: 'Alle hoch',   icon: 'mdi:arrow-up-box',        icon_color: 'blue',      service: 'cover.open_cover'  },
                { primary: 'Alle runter', icon: 'mdi:arrow-down-box',      icon_color: 'blue-grey', service: 'cover.close_cover' }],
      };
      if (!cfg[domain]) return null;
      return { type: 'horizontal-stack', cards: cfg[domain].map(b => ({
        type: 'custom:mushroom-template-card', primary: b.primary, icon: b.icon, icon_color: b.icon_color,
        tap_action: { action: 'call-service', service: b.service, service_data: { entity_id: entityIds } },
        fill_container: true,
      })) };
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 9 — VIEW BUILDERS
  // ═══════════════════════════════════════════════════════════════════════════

  const DOMAIN_ORDER  = ['light','cover','climate','fan','switch','media_player','sensor','binary_sensor','camera'];
  const DOMAIN_TITLES = { light:'Beleuchtung', cover:'Rollos & Vorh\u00e4nge', climate:'Klima', fan:'Ventilatoren', switch:'Schalter', media_player:'Medien', sensor:'Sensoren', binary_sensor:'Status', camera:'Kameras' };
  const DOMAIN_ICONS  = { light:'mdi:lightbulb', cover:'mdi:window-shutter', climate:'mdi:thermometer', fan:'mdi:fan', switch:'mdi:toggle-switch', media_player:'mdi:speaker', sensor:'mdi:eye', binary_sensor:'mdi:motion-sensor', camera:'mdi:camera' };
  const RELEVANT_SENSOR_CLASSES = new Set(['temperature','humidity','illuminance','motion','occupancy','door','window','battery']);

  const OverviewView = {
    generate(hass, config, registry, basePath) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const cards = [];
        const hour = new Date().getHours();
        const greeting = hour < 6 ? 'Gute Nacht' : hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
        cards.push({ type: 'custom:mushroom-title-card', title: greeting, subtitle: 'Willkommen im Smart Home' });
        const weatherEntity = config.weather_entity || Object.keys(hass.states || {}).find(id => id?.startsWith('weather.'));
        if (weatherEntity) cards.push(Cards.weather(weatherEntity));
        if (config.show_areas !== false) {
          const deviceAreaMap = R.buildDeviceAreaMap(devices);
          const filteredAreas = R.filterAreas(areas);
          if (filteredAreas.length) {
            const areaButtons = filteredAreas.map(area => {
              const ae = R.filterAvailable(R.filterByLabels(R.filterByArea(entities, area.area_id, deviceAreaMap)));
              const lights = ae.filter(e => e?.entity_id?.startsWith('light.'));
              return Cards.roomButton(area, basePath, lights[0]?.entity_id);
            });
            cards.push({ type: 'grid', cards: areaButtons, columns: 3, square: false });
          }
        }
        if (config.show_security !== false) {
          const sec = Collectors.collectSecurity(hass, entities);
          if (sec.locks.length || sec.doors.length || sec.windows.length || sec.alarm) {
            const secCards = [];
            if (sec.alarm)          secCards.push(Cards.entity(sec.alarm));
            if (sec.locks.length)   { secCards.push(Cards.section('Schl\u00f6sser')); sec.locks.forEach(id => secCards.push(Cards.entity(id))); }
            if (sec.doors.length)   { secCards.push(Cards.section('T\u00fcren'));     sec.doors.forEach(id => secCards.push(Cards.entity(id))); }
            if (sec.windows.length) { secCards.push(Cards.section('Fenster'));         sec.windows.forEach(id => secCards.push(Cards.entity(id))); }
            cards.push(Cards.section('Sicherheit'));
            cards.push({ type: 'grid', cards: secCards, columns: 2, square: false });
          }
        }
        if (config.show_battery_status !== false) {
          const bats = Collectors.collectBatteries(hass, entities);
          if (bats.critical.length || bats.low.length) {
            cards.push(Cards.section('Batterie-Warnung'));
            bats.critical.forEach(id => cards.push(Cards.entity(id, { icon_color: 'red' })));
            bats.low.forEach(id => cards.push(Cards.entity(id, { icon_color: 'orange' })));
          }
        }
        if (!cards.length) cards.push({ type: 'markdown', content: 'Dashboard wird geladen...' });
        return { title: '\u00dcbersicht', path: 'overview', icon: 'mdi:home', cards };
      } catch (e) {
        return { title: '\u00dcbersicht', path: 'overview', icon: 'mdi:home', cards: [Cards.error(e.message)] };
      }
    },
  };

  const RoomView = {
    generate(areaId, hass, config, registry) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const area = areas.find(a => a?.area_id === areaId);
        if (!area) return { title: areaId, path: areaId, cards: [Cards.error('Raum nicht gefunden: ' + areaId)] };
        const roomEntities = Collectors.collectRoomEntities(areaId, hass, entities, devices, config);
        const cards = [];
        const lightsOn    = (roomEntities.light || []).filter(id => hass.states[id]?.state === 'on').length;
        const totalLights = (roomEntities.light || []).length;
        cards.push({ type: 'custom:mushroom-title-card', title: area.name, subtitle: totalLights ? `${lightsOn} von ${totalLights} Lichtern an` : '', icon: area.icon || 'mdi:home' });
        if ((roomEntities.light || []).length > 1) { const gc = Cards.groupControl(roomEntities.light, 'light'); if (gc) cards.push(gc); }
        if ((roomEntities.cover || []).length > 1) { const gc = Cards.groupControl(roomEntities.cover, 'cover'); if (gc) cards.push(gc); }
        for (const domain of DOMAIN_ORDER) {
          if (!roomEntities[domain]?.length) continue;
          cards.push(Cards.section(DOMAIN_TITLES[domain] || domain));
          if      (domain === 'light')        roomEntities[domain].forEach(id => cards.push(Cards.light(id)));
          else if (domain === 'cover')        roomEntities[domain].forEach(id => cards.push(Cards.cover(id)));
          else if (domain === 'climate')      roomEntities[domain].forEach(id => cards.push(Cards.climate(id)));
          else if (domain === 'fan')          roomEntities[domain].forEach(id => cards.push(Cards.fan(id)));
          else if (domain === 'media_player') roomEntities[domain].forEach(id => cards.push(Cards.mediaPlayer(id)));
          else if (domain === 'sensor' || domain === 'binary_sensor') {
            const relevant = roomEntities[domain].filter(id => RELEVANT_SENSOR_CLASSES.has(hass.states[id]?.attributes?.device_class));
            if (!relevant.length) { cards.pop(); continue; }
            relevant.forEach(id => cards.push(Cards.entity(id)));
          }
          else roomEntities[domain].forEach(id => cards.push(Cards.entity(id)));
        }
        return { title: area.name, path: areaId, icon: area.icon || 'mdi:home', cards: cards.length > 1 ? cards : [{ type: 'markdown', content: 'Keine Ger\u00e4te in diesem Raum.' }] };
      } catch (e) {
        return { title: areaId, path: areaId, icon: 'mdi:home', cards: [Cards.error(e.message)] };
      }
    },
  };

  const SettingsView = {
    generate(hass, config, registry, basePath) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const urlPath = basePath.replace(/^\/+/, '');
        const cards = [];
        cards.push({ type: 'custom:mushroom-title-card', title: 'Einstellungen', subtitle: 'L30NEYN Dashboard v' + VERSION });
        cards.push({ type: 'markdown', content: [
          '## Konfiguration',
          `Erkannter Dashboard-\`url_path\`: **\`${urlPath}\`**`,
          '', '```yaml',
          'strategy:', '  type: custom:l30neyn-dashboard-strategy',
          '  navigation:', `    dashboard_url_path: ${urlPath}`,
          '  areas_options:', '    <area_id>:', '      groups_options:', '        <domain>:', '          hidden:', '            - entity.id',
          '```',
        ].join('\n') });
        const filteredAreas = R.filterAreas(areas);
        for (const area of filteredAreas) {
          const roomEntities = R.getRoomEntities(area.area_id, entities, devices, {});
          if (!Object.keys(roomEntities).length) continue;
          cards.push(Cards.section(area.name));
          const yamlLines = [`    ${area.area_id}:`];
          let hasContent = false;
          for (const domain of DOMAIN_ORDER) {
            if (!roomEntities[domain]?.length) continue;
            hasContent = true;
            const hiddenNow = R.getHiddenEntities(config, area.area_id, domain);
            yamlLines.push('      groups_options:', `        ${domain}:`, '          # Verf\u00fcgbare Entities:');
            roomEntities[domain].forEach(id => yamlLines.push(`          # - ${id}${hiddenNow.includes(id) ? '  # \u2190 ausgeblendet' : ''}`));
            yamlLines.push(hiddenNow.length ? '          hidden:' : '          hidden: []');
            hiddenNow.forEach(id => yamlLines.push(`            - ${id}`));
          }
          if (hasContent) cards.push({ type: 'markdown', content: `### ${area.name}\n\`\`\`yaml\nareas_options:\n${yamlLines.join('\n')}\n\`\`\`` });
        }
        cards.push(Cards.section('System-Info'));
        cards.push({ type: 'markdown', content: ['| | |','|---|---|',`| **Version** | ${VERSION} |`,`| **url_path** | \`${urlPath}\` |`,`| **Bereiche** | ${areas.length} |`,`| **Ger\u00e4te** | ${devices.length} |`,`| **Entities** | ${entities.length} |`].join('\n') });
        return { title: 'Einstellungen', path: 'settings', icon: 'mdi:cog', cards };
      } catch (e) {
        return { title: 'Einstellungen', path: 'settings', icon: 'mdi:cog', cards: [Cards.error(e.message)] };
      }
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 10 — CONFIG EDITOR ("Dashboard bearbeiten"-Panel)
  // ═══════════════════════════════════════════════════════════════════════════

  const EDITOR_STYLES = `
    :host {
      display: block;
      font-family: var(--primary-font-family, sans-serif);
      color: var(--primary-text-color);
    }

    /* ── Sektions-Überschriften ───────────────────────────── */
    .section-header {
      font-size: 11px;
      font-weight: 700;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 24px 0 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid var(--primary-color, #41BDF5);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-header:first-of-type { margin-top: 0; }
    .section-header ha-icon { --mdi-icon-size: 16px; color: var(--primary-color, #41BDF5); }

    /* ── Allgemein-Zeilen ─────────────────────────────────── */
    .general-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 4px;
      background: var(--secondary-background-color);
      transition: background 0.15s;
    }
    .general-row:hover { background: var(--table-row-alternative-background-color, rgba(0,0,0,0.05)); }
    .general-row label { font-size: 14px; flex: 1; cursor: pointer; }
    .general-row .sub  { font-size: 12px; color: var(--secondary-text-color); display: block; margin-top: 2px; }
    ha-switch { flex-shrink: 0; margin-left: 12px; }

    /* ── Raum-Block ───────────────────────────────────────── */
    .area-card {
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      margin-bottom: 10px;
      overflow: hidden;
      background: var(--card-background-color);
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      transition: box-shadow 0.2s;
    }
    .area-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.12); }

    /* Klickbarer Header zum Ein-/Ausklappen */
    .area-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
      background: var(--secondary-background-color);
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s, background 0.15s;
    }
    .area-header:hover { background: var(--table-row-alternative-background-color, rgba(0,0,0,0.05)); }
    .area-header.open  { border-bottom-color: var(--divider-color); }

    .area-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 600;
    }
    .area-header-left ha-icon { --mdi-icon-size: 20px; color: var(--secondary-text-color); }

    .area-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Badge: Anzahl ausgeblendeter Entities */
    .badge {
      font-size: 11px;
      font-weight: 700;
      background: var(--error-color, #db4437);
      color: #fff;
      border-radius: 10px;
      padding: 1px 7px;
      min-width: 18px;
      text-align: center;
      display: none;
    }
    .badge.visible { display: inline-block; }

    .chevron {
      --mdi-icon-size: 20px;
      color: var(--secondary-text-color);
      transition: transform 0.25s;
    }
    .chevron.open { transform: rotate(180deg); }

    /* Inhalt des Raum-Blocks */
    .area-content {
      padding: 0;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, padding 0.2s;
    }
    .area-content.open {
      max-height: 2000px;
      padding: 8px 0;
    }

    /* ── Domain-Gruppe ────────────────────────────────────── */
    .domain-block {
      padding: 6px 16px 10px;
    }

    .domain-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--divider-color);
    }

    .domain-header-left {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .domain-header-left ha-icon { --mdi-icon-size: 14px; }

    /* "Alle" Toggle für eine ganze Domain */
    .domain-all-btn {
      font-size: 11px;
      color: var(--primary-color, #41BDF5);
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--primary-color, #41BDF5);
      background: transparent;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .domain-all-btn:hover {
      background: var(--primary-color, #41BDF5);
      color: #fff;
    }

    /* ── Entity-Zeile ─────────────────────────────────────── */
    .entity-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 0;
    }
    .entity-row + .entity-row {
      border-top: 1px solid var(--divider-color);
    }
    .entity-label {
      flex: 1;
      min-width: 0;
    }
    .entity-name {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .entity-id-small {
      font-size: 11px;
      font-family: monospace;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Lade-Placeholder ─────────────────────────────────── */
    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text-color);
      font-size: 14px;
      padding: 16px 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
      width: 18px; height: 18px;
      border: 2px solid var(--divider-color);
      border-top-color: var(--primary-color, #41BDF5);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    /* ── Footer ───────────────────────────────────────────── */
    .editor-footer {
      font-size: 11px;
      color: var(--disabled-text-color);
      text-align: right;
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }
  `;

  class L30NEYNDashboardStrategyEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config   = {};
      this._hass     = null;
      this._registry = null;
      this._loading  = true;
      // Merkt sich welche Raum-Akkordeons offen sind (area_id → bool)
      this._openAreas = new Set();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._loading && hass) this._loadRegistry();
    }

    setConfig(config) {
      this._config = config ? JSON.parse(JSON.stringify(config)) : {};
      this._render();
    }

    async _loadRegistry() {
      this._loading = true;
      this._render();
      try {
        this._registry = await loadRegistryData(this._hass);
      } catch (e) {
        this._registry = { areas: [], devices: [], entities: [], source: 'error' };
      }
      this._loading = false;
      this._render();
    }

    _setConfigValue(key, value) {
      this._config = { ...this._config, [key]: value };
      this._fireConfigChanged();
      // kein _render() nötig – HA re-setzt setConfig nach config-changed
    }

    _toggleEntityHidden(areaId, domain, entityId, hidden) {
      const cfg = JSON.parse(JSON.stringify(this._config));
      cfg.areas_options                                             ??= {};
      cfg.areas_options[areaId]                                    ??= {};
      cfg.areas_options[areaId].groups_options                     ??= {};
      cfg.areas_options[areaId].groups_options[domain]             ??= {};
      cfg.areas_options[areaId].groups_options[domain].hidden      ??= [];
      const list = cfg.areas_options[areaId].groups_options[domain].hidden;
      const idx  = list.indexOf(entityId);
      if (hidden  && idx === -1) list.push(entityId);
      if (!hidden && idx !== -1) list.splice(idx, 1);
      this._config = cfg;
      this._render();
      this._fireConfigChanged();
    }

    // Alle Entities einer Domain auf einmal ein-/ausblenden
    _toggleDomainAll(areaId, domain, allEntityIds, hide) {
      const cfg = JSON.parse(JSON.stringify(this._config));
      cfg.areas_options                                        ??= {};
      cfg.areas_options[areaId]                               ??= {};
      cfg.areas_options[areaId].groups_options                ??= {};
      cfg.areas_options[areaId].groups_options[domain]        ??= {};
      cfg.areas_options[areaId].groups_options[domain].hidden  = hide ? [...allEntityIds] : [];
      this._config = cfg;
      this._render();
      this._fireConfigChanged();
    }

    _fireConfigChanged() {
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config }, bubbles: true, composed: true,
      }));
    }

    _toggleArea(areaId) {
      if (this._openAreas.has(areaId)) this._openAreas.delete(areaId);
      else                             this._openAreas.add(areaId);
      // Nur DOM-Updates, kein komplettes Re-Render
      const shadow = this.shadowRoot;
      const content = shadow.querySelector(`.area-content[data-area="${areaId}"]`);
      const header  = shadow.querySelector(`.area-header[data-area="${areaId}"]`);
      const chevron = header?.querySelector('.chevron');
      const isOpen  = this._openAreas.has(areaId);
      content?.classList.toggle('open', isOpen);
      header ?.classList.toggle('open', isOpen);
      chevron?.classList.toggle('open', isOpen);
    }

    _render() {
      const shadow = this.shadowRoot;
      const cfg    = this._config;

      const showAreas    = cfg.show_areas          !== false;
      const showSecurity = cfg.show_security       !== false;
      const showBattery  = cfg.show_battery_status !== false;

      // ── Räume-HTML ────────────────────────────────────────
      let areasHtml = '';
      if (this._loading) {
        areasHtml = `<div class="loading"><div class="spinner"></div>Lade R\u00e4ume und Ger\u00e4te\u2026</div>`;
      } else if (this._registry) {
        const { areas = [], entities = [], devices = [] } = this._registry;
        const filtered = R.filterAreas(areas);
        if (!filtered.length) {
          areasHtml = '<div class="loading">Keine Bereiche gefunden.</div>';
        } else {
          areasHtml = filtered.map(area => {
            const aId       = area.area_id;
            const isOpen    = this._openAreas.has(aId);
            // Alle verfügbaren Entities OHNE hidden-Filter (damit man togglen kann)
            const allByDomain = {};
            const rawEntities = R.filterAvailable(R.filterByLabels(
              R.filterByArea(entities, aId, R.buildDeviceAreaMap(devices))
            ));
            for (const [dom, ents] of R.groupByDomain(rawEntities)) {
              allByDomain[dom] = ents.map(e => e.entity_id);
            }

            // Anzahl ausgeblendeter Entities → Badge
            let hiddenCount = 0;
            for (const dom of DOMAIN_ORDER) {
              if (!allByDomain[dom]) continue;
              hiddenCount += R.getHiddenEntities(cfg, aId, dom).length;
            }

            // Domain-Blöcke
            const domainBlocks = DOMAIN_ORDER.map(dom => {
              if (!allByDomain[dom]?.length) return '';
              const hiddenNow   = R.getHiddenEntities(cfg, aId, dom);
              const allHidden   = hiddenNow.length === allByDomain[dom].length;
              const allVisible  = hiddenNow.length === 0;
              const btnLabel    = allHidden ? 'Alle einblenden' : 'Alle ausblenden';

              const entityRows = allByDomain[dom].map(id => {
                const isHidden = hiddenNow.includes(id);
                // Friendly name aus Registry wenn vorhanden
                const entObj   = entities.find(e => e.entity_id === id);
                const fname    = entObj?.name || entObj?.original_name || '';
                return `
                  <div class="entity-row">
                    <div class="entity-label">
                      ${fname ? `<div class="entity-name">${fname}</div>` : ''}
                      <div class="entity-id-small">${id}</div>
                    </div>
                    <ha-switch
                      data-area="${aId}"
                      data-domain="${dom}"
                      data-entity="${id}"
                      ${!isHidden ? 'checked' : ''}
                    ></ha-switch>
                  </div>`;
              }).join('');

              return `
                <div class="domain-block">
                  <div class="domain-header">
                    <div class="domain-header-left">
                      <ha-icon icon="${DOMAIN_ICONS[dom] || 'mdi:dots-horizontal'}"></ha-icon>
                      ${DOMAIN_TITLES[dom] || dom}
                    </div>
                    <button class="domain-all-btn"
                      data-area="${aId}"
                      data-domain="${dom}"
                      data-hide="${!allHidden}"
                      data-entities="${allByDomain[dom].join(',')}"
                    >${btnLabel}</button>
                  </div>
                  ${entityRows}
                </div>`;
            }).join('');

            return `
              <div class="area-card">
                <div class="area-header${isOpen ? ' open' : ''}" data-area="${aId}">
                  <div class="area-header-left">
                    <ha-icon icon="${area.icon || 'mdi:home'}"></ha-icon>
                    ${area.name}
                  </div>
                  <div class="area-header-right">
                    <span class="badge${hiddenCount > 0 ? ' visible' : ''}">${hiddenCount} ausgeblendet</span>
                    <ha-icon class="chevron${isOpen ? ' open' : ''}" icon="mdi:chevron-down"></ha-icon>
                  </div>
                </div>
                <div class="area-content${isOpen ? ' open' : ''}" data-area="${aId}">
                  ${domainBlocks || '<div style="padding:12px 16px;color:var(--secondary-text-color);font-size:13px">Keine Ger\u00e4te in diesem Raum.</div>'}
                </div>
              </div>`;
          }).join('');
        }
      }

      shadow.innerHTML = `
        <style>${EDITOR_STYLES}</style>

        <div class="section-header">
          <ha-icon icon="mdi:tune"></ha-icon>
          Allgemein
        </div>

        <div class="general-row">
          <label>
            Raum-\u00dcbersicht anzeigen
            <span class="sub">Zeigt alle Bereiche als Kacheln auf der Startseite</span>
          </label>
          <ha-switch id="sw-areas" ${showAreas ? 'checked' : ''}></ha-switch>
        </div>
        <div class="general-row">
          <label>
            Sicherheits-Widget anzeigen
            <span class="sub">Schl\u00f6sser, T\u00fcren, Fenster, Alarm</span>
          </label>
          <ha-switch id="sw-security" ${showSecurity ? 'checked' : ''}></ha-switch>
        </div>
        <div class="general-row">
          <label>
            Batterie-Warnungen anzeigen
            <span class="sub">Ger\u00e4te mit niedrigem Akkustand</span>
          </label>
          <ha-switch id="sw-battery" ${showBattery ? 'checked' : ''}></ha-switch>
        </div>

        <div class="section-header" style="margin-top:28px">
          <ha-icon icon="mdi:home-city"></ha-icon>
          Ger\u00e4te pro Raum
        </div>
        <div id="areas-container">${areasHtml}</div>

        <div class="editor-footer">L30NEYN Dashboard Strategy v${VERSION}</div>
      `;

      // ── Events: Allgemein ──────────────────────────────────
      shadow.getElementById('sw-areas')   ?.addEventListener('change', e => this._setConfigValue('show_areas',          e.target.checked));
      shadow.getElementById('sw-security')?.addEventListener('change', e => this._setConfigValue('show_security',       e.target.checked));
      shadow.getElementById('sw-battery') ?.addEventListener('change', e => this._setConfigValue('show_battery_status', e.target.checked));

      // ── Events: Raum-Akkordeon ─────────────────────────────
      shadow.querySelectorAll('.area-header').forEach(header => {
        header.addEventListener('click', () => this._toggleArea(header.dataset.area));
      });

      // ── Events: Alle-Toggle (Domain) ───────────────────────
      shadow.querySelectorAll('.domain-all-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const { area, domain, hide, entities: ents } = btn.dataset;
          this._toggleDomainAll(area, domain, ents.split(','), hide === 'true');
        });
      });

      // ── Events: Entity-Toggles ─────────────────────────────
      shadow.querySelectorAll('ha-switch[data-entity]').forEach(sw => {
        sw.addEventListener('change', e => {
          const { area, domain, entity } = e.target.dataset;
          this._toggleEntityHidden(area, domain, entity, !e.target.checked);
        });
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODUL 11 — DASHBOARD STRATEGY (Entry Point)
  // ═══════════════════════════════════════════════════════════════════════════

  class L30NEYNDashboardStrategy {
    static async generate(config, hass) {
      try {
        console.info(`[L30NEYN] Generating dashboard v${VERSION}`);
        const [registryData, basePath] = await Promise.all([
          loadRegistryData(hass),
          DashboardPathResolver.resolve(hass, config),
        ]);
        if (registryData.source === 'error') {
          return { views: [{ title: 'Fehler', path: 'overview', icon: 'mdi:alert-circle', cards: [Cards.error('Registry-Daten konnten nicht geladen werden', registryData.error)] }] };
        }
        const registry = { areas: registryData.areas, devices: registryData.devices, entities: registryData.entities };
        const views    = [];
        views.push(OverviewView.generate(hass, config, registry, basePath));
        for (const area of registryData.areas) {
          if (!area?.area_id || area.labels?.includes('no_dboard')) continue;
          views.push(RoomView.generate(area.area_id, hass, config, registry));
        }
        views.push(SettingsView.generate(hass, config, registry, basePath));
        console.info(`[L30NEYN] Generated ${views.length} views`);
        return { views };
      } catch (e) {
        console.error('[L30NEYN] Critical error:', e);
        return { views: [{ title: 'Fehler', path: 'overview', icon: 'mdi:alert-octagon', cards: [Cards.error(e.message, e.stack || '')] }] };
      }
    }

    static getConfigElement() {
      return document.createElement('l30neyn-dashboard-strategy-editor');
    }

    static getStubConfig() {
      return { show_areas: true, show_security: true, show_battery_status: true, navigation: {}, areas_options: {} };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ═══════════════════════════════════════════════════════════════════════════

  const register = (name, cls) => {
    try { customElements.define(name, cls); }
    catch (e) { if (e.name !== 'NotSupportedError') console.error('[L30NEYN] Registration failed:', name, e); }
  };

  register('l30neyn-dashboard-strategy-editor',      L30NEYNDashboardStrategyEditor);
  register('ll-strategy-l30neyn-dashboard-strategy', L30NEYNDashboardStrategy);

  console.info(
    `%c L30NEYN-DASHBOARD %c v${VERSION} `,
    'background:#41BDF5;color:#fff;font-weight:bold;padding:3px 5px;',
    'background:#4CAF50;color:#fff;font-weight:bold;padding:3px 5px;'
  );

})();

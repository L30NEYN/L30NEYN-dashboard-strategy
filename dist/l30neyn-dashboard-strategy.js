/**
 * L30NEYN Dashboard Strategy
 * @version 1.6.9
 * @license MIT
 */

(function () {
  'use strict';

  const VERSION = '1.6.9';
  console.info('[L30NEYN] Loading dashboard strategy v' + VERSION);

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 1 — WEBSOCKET HELPER
  // ════════════════════════════════════════════════════════════════════════════════

  const callWS = async (hass, message) => {
    if (typeof hass.callWS === 'function') return await hass.callWS(message);
    if (hass.connection?.sendMessagePromise) return await hass.connection.sendMessagePromise(message);
    throw new Error('No WebSocket method available on hass object');
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 2 — REGISTRY DATA LOADER
  // ════════════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 3 — DASHBOARD CONTEXT RESOLVER
  // ════════════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 4 — DASHBOARD PATH RESOLVER
  // ════════════════════════════════════════════════════════════════════════════════

  const DashboardPathResolver = {
    async resolve(hass, config) {
      const ctx = await DashboardContextResolver.resolve(hass, config);
      return '/' + ctx.url_path;
    },
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 5 — NAVIGATION BUILDER
  // ════════════════════════════════════════════════════════════════════════════════

  const NavigationBuilder = {
    room(basePath, areaId)  { return `${basePath}/${areaId}`; },
    overview(basePath)      { return `${basePath}/overview`; },
    settings(basePath)      { return `${basePath}/settings`; },
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 6 — REGISTRY HELPERS
  // ════════════════════════════════════════════════════════════════════════════════

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

    // Sortiert Bereiche gemäß area_order config (nicht konfigurierte kommen alphabetisch danach)
    sortAreas(areas, areaOrder) {
      if (!areaOrder?.length) return areas;
      const ordered = [];
      const remaining = [...areas];
      for (const id of areaOrder) {
        const idx = remaining.findIndex(a => a.area_id === id);
        if (idx !== -1) { ordered.push(remaining.splice(idx, 1)[0]); }
      }
      remaining.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
      return [...ordered, ...remaining];
    },

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

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 7 — DATA COLLECTORS
  // ════════════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 8 — CARD BUILDERS (Mushroom)
  // ════════════════════════════════════════════════════════════════════════════════

  const Cards = {
    light:       (id) => ({ type: 'custom:mushroom-light-card',        entity: id, show_brightness_control: true, show_color_control: true, show_color_temp_control: true, collapsible_controls: true, fill_container: true }),
    cover:       (id) => ({ type: 'custom:mushroom-cover-card',        entity: id, show_position_control: true, show_tilt_position_control: false, show_buttons_control: true, fill_container: true }),
    climate:     (id) => ({ type: 'custom:mushroom-climate-card',      entity: id, show_temperature_control: true, collapsible_controls: true, fill_container: true }),
    fan:         (id) => ({ type: 'custom:mushroom-fan-card',          entity: id, show_percentage_control: true, show_oscillate_control: true, collapsible_controls: true, fill_container: true }),
    mediaPlayer: (id) => ({ type: 'custom:mushroom-media-player-card', entity: id, use_media_info: true, show_volume_level: true, media_controls: ['on_off','play_pause','previous','next'], volume_controls: ['volume_mute','volume_set','volume_buttons'], collapsible_controls: true, fill_container: true }),
    entity:      (id, opts = {}) => ({ type: 'custom:mushroom-entity-card', entity: id, fill_container: true, ...opts }),
    title:       (t, sub = '') => ({ type: 'custom:mushroom-title-card', title: t, subtitle: sub }),
    weather:     (entity) => ({ type: 'weather-forecast', entity, show_forecast: true }),
    error(error, details = '') {
      return { type: 'markdown', content: `# ⚠️ Dashboard Fehler\n\n**${error}**\n\n\`\`\`\n${details}\n\`\`\`` };
    },

    roomTitle(area, aOpts) {
      return {
        type: 'custom:mushroom-title-card',
        title: aOpts?.title_override || area.name,
        subtitle: '',
      };
    },

    roomChipsHeader(area, aOpts, roomEntities, hass) {
      const chips = [];

      chips.push({
        type: 'template',
        icon: aOpts?.icon_override || area.icon || 'mdi:home',
        icon_color: 'blue',
        content: aOpts?.title_override || area.name,
        tap_action: { action: 'none' },
      });

      const tempId = aOpts?.primary_sensors?.temperature;
      const climId = (roomEntities.climate || [])[0];
      if (tempId && hass.states[tempId]) {
        chips.push({ type: 'template', icon: 'mdi:thermometer', icon_color: 'red',
          content: `{{ states('${tempId}') | float(0) | round(1) }} °C`,
          tap_action: { action: 'more-info', entity: tempId } });
      } else if (climId && hass.states[climId]) {
        chips.push({ type: 'template', icon: 'mdi:thermometer', icon_color: 'red',
          content: `{{ state_attr('${climId}', 'current_temperature') | round(1) }} °C`,
          tap_action: { action: 'more-info', entity: climId } });
      }

      const humId = aOpts?.primary_sensors?.humidity;
      if (humId && hass.states[humId]) {
        chips.push({ type: 'template', icon: 'mdi:water-percent', icon_color: 'blue',
          content: `{{ states('${humId}') | float(0) | round(0) }} %`,
          tap_action: { action: 'more-info', entity: humId } });
      }

      const luxId = aOpts?.primary_sensors?.illuminance;
      if (luxId && hass.states[luxId]) {
        chips.push({ type: 'template', icon: 'mdi:brightness-5', icon_color: 'yellow',
          content: `{{ states('${luxId}') | float(0) | round(0) }} lx`,
          tap_action: { action: 'more-info', entity: luxId } });
      }

      const co2Id = aOpts?.primary_sensors?.co2;
      if (co2Id && hass.states[co2Id]) {
        chips.push({ type: 'template', icon: 'mdi:molecule-co2',
          icon_color: `{{ 'red' if states('${co2Id}') | float(0) > 1200 else ('orange' if states('${co2Id}') | float(0) > 800 else 'green') }}`,
          content: `{{ states('${co2Id}') | float(0) | round(0) }} ppm`,
          tap_action: { action: 'more-info', entity: co2Id } });
      }

      const lights = roomEntities.light || [];
      if (lights.length > 0) {
        const idList = lights.map(id => `'${id}'`).join(',');
        chips.push({ type: 'template', icon: 'mdi:lightbulb-group',
          icon_color: `{{ 'amber' if [${idList}] | select('is_state', 'on') | list | count > 0 else 'grey' }}`,
          content: `{{ [${idList}] | select('is_state', 'on') | list | count }} / ${lights.length}`,
          tap_action: { action: 'none' } });
      }

      const covers = roomEntities.cover || [];
      if (covers.length > 0) {
        const idList = covers.map(id => `'${id}'`).join(',');
        chips.push({ type: 'template', icon: 'mdi:window-shutter-open',
          icon_color: `{{ 'blue' if [${idList}] | select('is_state', 'open') | list | count > 0 else 'grey' }}`,
          content: `{{ [${idList}] | select('is_state', 'open') | list | count }} / ${covers.length}`,
          tap_action: { action: 'none' } });
      }

      if (climId && hass.states[climId]) {
        chips.push({ type: 'template', icon: 'mdi:thermostat',
          icon_color: `{{ 'orange' if is_state('${climId}', 'heat') or is_state('${climId}', 'heat_cool') else 'blue' }}`,
          content: `{{ state_attr('${climId}', 'temperature') | round(1) }} °C`,
          tap_action: { action: 'more-info', entity: climId } });
      }

      return {
        type: 'custom:mushroom-chips-card',
        chips,
        alignment: 'start',
        card_mod: {
          style: `
            ha-card {
              background: none !important;
              box-shadow: none !important;
              padding: 4px 0 8px !important;
            }
          `,
        },
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

    roomButton(area, basePath, config) {
      const aOpts    = config?.areas_options?.[area.area_id] || {};
      const tempId   = aOpts?.primary_sensors?.temperature;
      const lightInd = aOpts?.light_indicator;
      return {
        type: 'custom:mushroom-template-card',
        primary: aOpts.title_override || area.name,
        icon: aOpts.icon_override || area.icon || 'mdi:home',
        icon_color: lightInd
          ? `{{ 'amber' if is_state('${lightInd}', 'on') else 'grey' }}`
          : 'grey',
        secondary: tempId
          ? `{{ states('${tempId}') | float(0) | round(1) }} °C`
          : (aOpts?.subtitle || ''),
        tap_action: { action: 'navigate', navigation_path: NavigationBuilder.room(basePath, area.area_id) },
        fill_container: false,
      };
    },
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 9 — VIEW BUILDERS
  // ════════════════════════════════════════════════════════════════════════════════

  const DOMAIN_ORDER  = ['light','cover','climate','fan','switch','media_player','sensor','binary_sensor','camera'];
  const DOMAIN_TITLES = { light:'Beleuchtung', cover:'Rollos & Vorhänge', climate:'Klima', fan:'Ventilatoren', switch:'Schalter', media_player:'Medien', sensor:'Sensoren', binary_sensor:'Status', camera:'Kameras' };
  const DOMAIN_ICONS  = { light:'mdi:lightbulb', cover:'mdi:window-shutter', climate:'mdi:thermometer', fan:'mdi:fan', switch:'mdi:toggle-switch', media_player:'mdi:speaker', sensor:'mdi:eye', binary_sensor:'mdi:bell-ring', camera:'mdi:camera' };

  // Relevante device_classes für sensor-Spalte (Messwerte)
  const SENSOR_CLASSES = new Set(['temperature','humidity','illuminance','battery']);

  // Relevante device_classes für binary_sensor-Spalte (Status/Ereignisse)
  const BINARY_SENSOR_CLASSES = new Set([
    'motion','occupancy','door','window','smoke','moisture',
    'vibration','gas','battery','connectivity','plug','presence',
  ]);

  const PRIMARY_SENSOR_CLASSES = [
    { key: 'temperature', label: 'Temperatur',  icon: 'mdi:thermometer',   unit: '°C' },
    { key: 'humidity',    label: 'Luftfeuchte', icon: 'mdi:water-percent', unit: '%'  },
    { key: 'illuminance', label: 'Helligkeit',  icon: 'mdi:brightness-5',  unit: 'lx' },
    { key: 'co2',         label: 'CO₂',         icon: 'mdi:molecule-co2',  unit: 'ppm' },
    { key: 'pm25',        label: 'PM2.5',       icon: 'mdi:air-filter',    unit: 'µg/m³' },
  ];

  // ── Spalten-Basis-Konfiguration ────────────────────────────────────────────────
  // Schlüssel = erster domain-Wert (zur Identifikation in column_order)
  const COLUMN_DEFS = [
    { key: 'light',         domains: ['light'],          title: 'Beleuchtung', icon: 'mdi:lightbulb'      },
    { key: 'cover',         domains: ['cover'],          title: 'Rollos',      icon: 'mdi:window-shutter' },
    { key: 'climate',       domains: ['climate', 'fan'], title: 'Klima',       icon: 'mdi:thermometer'    },
    { key: 'media_player',  domains: ['media_player'],   title: 'Medien',      icon: 'mdi:speaker'        },
    { key: 'switch',        domains: ['switch'],         title: 'Schalter',    icon: 'mdi:toggle-switch'  },
    { key: 'sensor',        domains: ['sensor'],         title: 'Sensoren',    icon: 'mdi:eye'            },
    { key: 'binary_sensor', domains: ['binary_sensor'],  title: 'Status',      icon: 'mdi:bell-ring'      },
    { key: 'camera',        domains: ['camera'],         title: 'Kameras',     icon: 'mdi:camera'         },
  ];

  // Gibt COLUMN_DEFS in der durch config.column_order gewünschten Reihenfolge zurück
  const resolveColumnOrder = (config) => {
    const order = config?.column_order;
    if (!order?.length) return COLUMN_DEFS;
    const map = new Map(COLUMN_DEFS.map(c => [c.key, c]));
    const sorted = [];
    for (const key of order) { if (map.has(key)) sorted.push(map.get(key)); }
    // Nicht konfigurierte Spalten hinten anhängen
    for (const col of COLUMN_DEFS) { if (!sorted.includes(col)) sorted.push(col); }
    return sorted;
  };

  // Baut eine einzelne Domain-Spalte als vertical-stack
  const buildColumn = (colDef, roomEntities, hass) => {
    const colCards = [];

    colCards.push({ type: 'custom:mushroom-title-card', title: colDef.title, subtitle: '' });

    for (const domain of colDef.domains) {
      const ids = roomEntities[domain] || [];
      if (!ids.length) continue;

      if (domain === 'light') {
        if (ids.length > 1) { const gc = Cards.groupControl(ids, 'light'); if (gc) colCards.push(gc); }
        ids.forEach(id => colCards.push(Cards.light(id)));
      } else if (domain === 'cover') {
        if (ids.length > 1) { const gc = Cards.groupControl(ids, 'cover'); if (gc) colCards.push(gc); }
        ids.forEach(id => colCards.push(Cards.cover(id)));
      } else if (domain === 'climate') {
        ids.forEach(id => colCards.push(Cards.climate(id)));
      } else if (domain === 'fan') {
        ids.forEach(id => colCards.push(Cards.fan(id)));
      } else if (domain === 'media_player') {
        ids.forEach(id => colCards.push(Cards.mediaPlayer(id)));
      } else if (domain === 'sensor') {
        const relevant = ids.filter(id => SENSOR_CLASSES.has(hass.states[id]?.attributes?.device_class));
        relevant.forEach(id => colCards.push(Cards.entity(id)));
      } else if (domain === 'binary_sensor') {
        const relevant = ids.filter(id => BINARY_SENSOR_CLASSES.has(hass.states[id]?.attributes?.device_class));
        relevant.forEach(id => colCards.push(Cards.entity(id)));
      } else {
        ids.forEach(id => colCards.push(Cards.entity(id)));
      }
    }

    if (colCards.length <= 1) return null;
    return { type: 'vertical-stack', cards: colCards };
  };

  // ── OVERVIEW VIEW ──────────────────────────────────────────────────────────────

  const OverviewView = {
    generate(hass, config, registry, basePath) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const cards = [];

        const hour = new Date().getHours();
        const greeting = hour < 6 ? 'Gute Nacht' : hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
        cards.push(Cards.title(greeting, 'Smart Home Übersicht'));

        const weatherEntity = config.weather_entity || Object.keys(hass.states || {}).find(id => id?.startsWith('weather.'));
        if (weatherEntity) cards.push(Cards.weather(weatherEntity));

        if (config.show_areas !== false) {
          const deviceAreaMap = R.buildDeviceAreaMap(devices);
          const filteredAreas = R.sortAreas(R.filterAreas(areas), config.area_order);
          if (filteredAreas.length) {
            const areaButtons = filteredAreas.map(area => {
              const ae = R.filterAvailable(R.filterByLabels(R.filterByArea(entities, area.area_id, deviceAreaMap)));
              const lights = ae.filter(e => e?.entity_id?.startsWith('light.'));
              const aOpts  = config?.areas_options?.[area.area_id] || {};
              const lightIndicator = aOpts?.light_indicator || lights[0]?.entity_id;
              const enrichedConfig = {
                ...config,
                areas_options: { ...config?.areas_options, [area.area_id]: { ...aOpts, light_indicator: lightIndicator } },
              };
              return Cards.roomButton(area, basePath, enrichedConfig);
            });
            cards.push({ type: 'grid', cards: areaButtons, columns: 3, square: false });
          }
        }

        if (config.show_security !== false) {
          const sec = Collectors.collectSecurity(hass, entities);
          if (sec.locks.length || sec.doors.length || sec.windows.length || sec.alarm) {
            cards.push(Cards.title('Sicherheit'));
            const secCards = [];
            if (sec.alarm)          secCards.push(Cards.entity(sec.alarm));
            if (sec.locks.length)   sec.locks  .forEach(id => secCards.push(Cards.entity(id)));
            if (sec.doors.length)   sec.doors  .forEach(id => secCards.push(Cards.entity(id)));
            if (sec.windows.length) sec.windows.forEach(id => secCards.push(Cards.entity(id)));
            cards.push({ type: 'grid', cards: secCards, columns: 2, square: false });
          }
        }

        if (config.show_battery_status !== false) {
          const bats = Collectors.collectBatteries(hass, entities);
          if (bats.critical.length || bats.low.length) {
            cards.push(Cards.title('Batterie-Warnung'));
            bats.critical.forEach(id => cards.push(Cards.entity(id, { icon_color: 'red' })));
            bats.low     .forEach(id => cards.push(Cards.entity(id, { icon_color: 'orange' })));
          }
        }

        if (!cards.length) cards.push({ type: 'markdown', content: 'Dashboard wird geladen...' });
        return { title: 'Übersicht', path: 'overview', icon: 'mdi:home', cards };
      } catch (e) {
        return { title: 'Übersicht', path: 'overview', icon: 'mdi:home', cards: [Cards.error(e.message)] };
      }
    },
  };

  // ── ROOM VIEW ──────────────────────────────────────────────────────────────────

  const RoomView = {
    generate(areaId, hass, config, registry) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const area = areas.find(a => a?.area_id === areaId);
        if (!area) return { title: areaId, path: areaId, cards: [Cards.error('Raum nicht gefunden: ' + areaId)] };

        const aOpts        = config?.areas_options?.[areaId] || {};
        const roomEntities = Collectors.collectRoomEntities(areaId, hass, entities, devices, config);

        // ── Spalten aufbauen (mit konfigurierbarer Reihenfolge) ─────────────
        const orderedCols   = resolveColumnOrder(config);
        const populatedCols = [];
        for (const colDef of orderedCols) {
          const hasContent = colDef.domains.some(d => {
            if (!roomEntities[d]?.length) return false;
            if (d === 'sensor')        return roomEntities[d].some(id => SENSOR_CLASSES.has(hass.states[id]?.attributes?.device_class));
            if (d === 'binary_sensor') return roomEntities[d].some(id => BINARY_SENSOR_CLASSES.has(hass.states[id]?.attributes?.device_class));
            return true;
          });
          if (!hasContent) continue;
          const colStack = buildColumn(colDef, roomEntities, hass);
          if (colStack) populatedCols.push(colStack);
        }

        let columnsBlock;
        if (populatedCols.length === 0) {
          columnsBlock = { type: 'markdown', content: 'Keine Geräte in diesem Raum.' };
        } else if (populatedCols.length === 1) {
          columnsBlock = populatedCols[0];
        } else {
          columnsBlock = { type: 'horizontal-stack', cards: populatedCols };
        }

        const roomCard = {
          type: 'vertical-stack',
          cards: [
            Cards.roomTitle(area, aOpts),
            Cards.roomChipsHeader(area, aOpts, roomEntities, hass),
            columnsBlock,
          ],
        };

        return {
          title: aOpts.title_override || area.name,
          path: areaId,
          icon: aOpts.icon_override || area.icon || 'mdi:home',
          panel: true,
          cards: [roomCard],
        };
      } catch (e) {
        return { title: areaId, path: areaId, icon: 'mdi:home', cards: [Cards.error(e.message)] };
      }
    },
  };

  // ── SETTINGS VIEW ──────────────────────────────────────────────────────────────

  const SettingsView = {
    generate(hass, config, registry, basePath) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const urlPath = basePath.replace(/^\/+/, '');
        const cards   = [];
        cards.push(Cards.title('Einstellungen', 'L30NEYN Dashboard v' + VERSION));
        cards.push({ type: 'markdown', content: [
          '## Konfiguration',
          `Erkannter Dashboard-\`url_path\`: **\`${urlPath}\`**`,
          '', '```yaml',
          'strategy:', '  type: custom:l30neyn-dashboard-strategy',
          '  navigation:', `    dashboard_url_path: ${urlPath}`,
          '  # Spaltenreihenfolge (Keys: light, cover, climate, media_player, switch, sensor, binary_sensor, camera)',
          '  column_order: [light, cover, climate, switch, media_player, sensor, binary_sensor, camera]',
          '  # Raumreihenfolge (area_ids aus HA)',
          '  area_order: []',
          '  areas_options:', '    <area_id>:', '      title_override: "Mein Raum"',
          '      icon_override: mdi:sofa',
          '```',
        ].join('\n') });
        const sortedAreas = R.sortAreas(R.filterAreas(areas), config.area_order);
        for (const area of sortedAreas) {
          const roomEntities = R.getRoomEntities(area.area_id, entities, devices, {});
          if (!Object.keys(roomEntities).length) continue;
          cards.push(Cards.title(area.name));
          const yamlLines = [`    ${area.area_id}:`];
          let hasContent = false;
          for (const domain of DOMAIN_ORDER) {
            if (!roomEntities[domain]?.length) continue;
            hasContent = true;
            const hiddenNow = R.getHiddenEntities(config, area.area_id, domain);
            yamlLines.push('      groups_options:', `        ${domain}:`, '          # Verfügbare Entities:');
            roomEntities[domain].forEach(id => yamlLines.push(`          # - ${id}${hiddenNow.includes(id) ? '  # ← ausgeblendet' : ''}`));
            yamlLines.push(hiddenNow.length ? '          hidden:' : '          hidden: []');
            hiddenNow.forEach(id => yamlLines.push(`            - ${id}`));
          }
          if (hasContent) cards.push({ type: 'markdown', content: `### ${area.name}\n\`\`\`yaml\nareas_options:\n${yamlLines.join('\n')}\n\`\`\`` });
        }
        cards.push(Cards.title('System-Info'));
        cards.push({ type: 'markdown', content: ['| | |','|---|---|',`| **Version** | ${VERSION} |`,`| **url_path** | \`${urlPath}\` |`,`| **Bereiche** | ${areas.length} |`,`| **Geräte** | ${devices.length} |`,`| **Entities** | ${entities.length} |`].join('\n') });
        return { title: 'Einstellungen', path: 'settings', icon: 'mdi:cog', cards };
      } catch (e) {
        return { title: 'Einstellungen', path: 'settings', icon: 'mdi:cog', cards: [Cards.error(e.message)] };
      }
    },
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 10 — CONFIG EDITOR
  // ════════════════════════════════════════════════════════════════════════════════

  const EDITOR_STYLES = `
    :host { display: block; font-family: var(--primary-font-family, sans-serif); color: var(--primary-text-color); }

    .section-header { font-size: 11px; font-weight: 700; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 8px; padding-bottom: 6px; border-bottom: 2px solid var(--primary-color, #41BDF5); display: flex; align-items: center; gap: 6px; }
    .section-header:first-of-type { margin-top: 0; }
    .section-header ha-icon { --mdi-icon-size: 16px; color: var(--primary-color, #41BDF5); }

    .general-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; margin-bottom: 4px; background: var(--secondary-background-color); transition: background 0.15s; }
    .general-row:hover { background: var(--table-row-alternative-background-color, rgba(0,0,0,0.05)); }
    .general-row label { font-size: 14px; flex: 1; cursor: pointer; }
    .general-row .sub { font-size: 12px; color: var(--secondary-text-color); display: block; margin-top: 2px; }
    ha-switch { flex-shrink: 0; margin-left: 12px; }

    /* ── Sortier-Reihen ── */
    .sort-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
    .sort-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--secondary-background-color); border-radius: 8px; border: 1px solid var(--divider-color); }
    .sort-row-label { flex: 1; font-size: 13px; display: flex; align-items: center; gap: 6px; }
    .sort-row-label ha-icon { --mdi-icon-size: 16px; color: var(--secondary-text-color); }
    .sort-btn { background: none; border: none; cursor: pointer; color: var(--secondary-text-color); padding: 2px 4px; border-radius: 4px; line-height: 1; font-size: 16px; transition: color 0.15s, background 0.15s; }
    .sort-btn:hover { color: var(--primary-color, #41BDF5); background: rgba(65,189,245,0.1); }
    .sort-btn:disabled { opacity: 0.25; cursor: default; }

    .area-card { border: 1px solid var(--divider-color); border-radius: 12px; margin-bottom: 10px; overflow: hidden; background: var(--card-background-color); box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: box-shadow 0.2s; }
    .area-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
    .area-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; user-select: none; background: var(--secondary-background-color); border-bottom: 1px solid transparent; transition: border-color 0.2s, background 0.15s; }
    .area-header:hover { background: var(--table-row-alternative-background-color, rgba(0,0,0,0.05)); }
    .area-header.open { border-bottom-color: var(--divider-color); }
    .area-header-left { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; }
    .area-header-left ha-icon { --mdi-icon-size: 20px; color: var(--secondary-text-color); }
    .area-header-right { display: flex; align-items: center; gap: 6px; }
    .badge { font-size: 11px; font-weight: 700; background: var(--error-color, #db4437); color: #fff; border-radius: 10px; padding: 1px 7px; display: none; }
    .badge.visible { display: inline-block; }
    .area-sort-btn { background: none; border: none; cursor: pointer; color: var(--secondary-text-color); padding: 2px 4px; border-radius: 4px; font-size: 15px; line-height: 1; transition: color 0.15s; }
    .area-sort-btn:hover { color: var(--primary-color, #41BDF5); }
    .area-sort-btn:disabled { opacity: 0.2; cursor: default; }
    .chevron { --mdi-icon-size: 20px; color: var(--secondary-text-color); transition: transform 0.25s; }
    .chevron.open { transform: rotate(180deg); }
    .area-content { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
    .area-content.open { max-height: 4000px; }

    .tabs { display: flex; border-bottom: 1px solid var(--divider-color); background: var(--secondary-background-color); }
    .tab-btn { flex: 1; padding: 9px 4px; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-align: center; cursor: pointer; border: none; background: transparent; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; text-transform: uppercase; letter-spacing: 0.5px; }
    .tab-btn.active { color: var(--primary-color, #41BDF5); border-bottom-color: var(--primary-color, #41BDF5); }
    .tab-btn:hover:not(.active) { color: var(--primary-text-color); }
    .tab-pane { display: none; padding: 12px 0 4px; }
    .tab-pane.active { display: block; }

    .domain-block { padding: 4px 16px 10px; }
    .domain-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid var(--divider-color); }
    .domain-header-left { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; }
    .domain-header-left ha-icon { --mdi-icon-size: 14px; }
    .domain-all-btn { font-size: 11px; color: var(--primary-color, #41BDF5); cursor: pointer; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--primary-color, #41BDF5); background: transparent; transition: background 0.15s, color 0.15s; white-space: nowrap; }
    .domain-all-btn:hover { background: var(--primary-color, #41BDF5); color: #fff; }
    .entity-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; }
    .entity-row + .entity-row { border-top: 1px solid var(--divider-color); }
    .entity-label { flex: 1; min-width: 0; }
    .entity-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .entity-id-small { font-size: 11px; font-family: monospace; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .room-opts { padding: 8px 16px 12px; }
    .opt-row { margin-bottom: 14px; }
    .opt-label { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }
    .opt-label ha-icon { --mdi-icon-size: 14px; }
    .opt-select { width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 13px; font-family: inherit; cursor: pointer; }
    .opt-select:focus { outline: none; border-color: var(--primary-color, #41BDF5); }
    .opt-input { width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 13px; font-family: inherit; box-sizing: border-box; }
    .opt-input:focus { outline: none; border-color: var(--primary-color, #41BDF5); }
    .opt-hint { font-size: 11px; color: var(--secondary-text-color); margin-top: 3px; }

    .loading { display: flex; align-items: center; gap: 8px; color: var(--secondary-text-color); font-size: 14px; padding: 16px 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { width: 18px; height: 18px; border: 2px solid var(--divider-color); border-top-color: var(--primary-color, #41BDF5); border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
    .editor-footer { font-size: 11px; color: var(--disabled-text-color); text-align: right; margin-top: 20px; padding-top: 8px; border-top: 1px solid var(--divider-color); }
  `;

  class L30NEYNDashboardStrategyEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config    = {};
      this._hass      = null;
      this._registry  = null;
      this._loading   = true;
      this._openAreas = new Set();
      this._activeTab = new Map();
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
      try { this._registry = await loadRegistryData(this._hass); }
      catch (e) { this._registry = { areas: [], devices: [], entities: [], source: 'error' }; }
      this._loading = false;
      this._render();
    }

    _setConfigValue(key, value) {
      this._config = { ...this._config, [key]: value };
      this._fireConfigChanged();
    }

    _setAreaOption(areaId, key, value) {
      const cfg = JSON.parse(JSON.stringify(this._config));
      cfg.areas_options         ??= {};
      cfg.areas_options[areaId]  ??= {};
      if (value === '' || value === null || value === undefined) delete cfg.areas_options[areaId][key];
      else cfg.areas_options[areaId][key] = value;
      this._config = cfg;
      this._render();
      this._fireConfigChanged();
    }

    _setPrimarySensor(areaId, sensorClass, entityId) {
      const cfg = JSON.parse(JSON.stringify(this._config));
      cfg.areas_options                            ??= {};
      cfg.areas_options[areaId]                    ??= {};
      cfg.areas_options[areaId].primary_sensors    ??= {};
      if (entityId) cfg.areas_options[areaId].primary_sensors[sensorClass] = entityId;
      else          delete cfg.areas_options[areaId].primary_sensors[sensorClass];
      this._config = cfg;
      this._render();
      this._fireConfigChanged();
    }

    _toggleEntityHidden(areaId, domain, entityId, hidden) {
      const cfg = JSON.parse(JSON.stringify(this._config));
      cfg.areas_options                                        ??= {};
      cfg.areas_options[areaId]                               ??= {};
      cfg.areas_options[areaId].groups_options                ??= {};
      cfg.areas_options[areaId].groups_options[domain]        ??= {};
      cfg.areas_options[areaId].groups_options[domain].hidden ??= [];
      const list = cfg.areas_options[areaId].groups_options[domain].hidden;
      const idx  = list.indexOf(entityId);
      if (hidden  && idx === -1) list.push(entityId);
      if (!hidden && idx !== -1) list.splice(idx, 1);
      this._config = cfg;
      this._render();
      this._fireConfigChanged();
    }

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

    // Spaltenreihenfolge: Eintrag an idx um einen Schritt verschieben
    _moveColumn(idx, dir) {
      const cfg   = JSON.parse(JSON.stringify(this._config));
      const order = cfg.column_order?.length ? [...cfg.column_order] : COLUMN_DEFS.map(c => c.key);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= order.length) return;
      [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
      cfg.column_order = order;
      this._config = cfg;
      this._render();
      this._fireConfigChanged();
    }

    // Raumreihenfolge: area_id an idx um einen Schritt verschieben
    _moveArea(areaId, dir, allAreaIds) {
      const cfg   = JSON.parse(JSON.stringify(this._config));
      // Baue vollständige area_order aus aktuellem Stand (falls noch nicht gesetzt)
      let order = cfg.area_order?.length ? [...cfg.area_order] : [...allAreaIds];
      // Stelle sicher dass alle aktuellen Bereiche enthalten sind
      for (const id of allAreaIds) { if (!order.includes(id)) order.push(id); }
      const idx    = order.indexOf(areaId);
      const newIdx = idx + dir;
      if (idx === -1 || newIdx < 0 || newIdx >= order.length) return;
      [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
      cfg.area_order = order;
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
      const shadow  = this.shadowRoot;
      const content = shadow.querySelector(`.area-content[data-area="${areaId}"]`);
      const header  = shadow.querySelector(`.area-header[data-area="${areaId}"]`);
      const chevron = header?.querySelector('.chevron');
      const isOpen  = this._openAreas.has(areaId);
      content?.classList.toggle('open', isOpen);
      header ?.classList.toggle('open', isOpen);
      chevron?.classList.toggle('open', isOpen);
    }

    _switchTab(areaId, tab) {
      this._activeTab.set(areaId, tab);
      const shadow = this.shadowRoot;
      shadow.querySelectorAll(`.tab-btn[data-area="${areaId}"]`).forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
      shadow.querySelectorAll(`.tab-pane[data-area="${areaId}"]`).forEach(pane => pane.classList.toggle('active', pane.dataset.tab === tab));
    }

    _render() {
      const shadow = this.shadowRoot;
      const cfg    = this._config;

      const showAreas    = cfg.show_areas          !== false;
      const showSecurity = cfg.show_security       !== false;
      const showBattery  = cfg.show_battery_status !== false;

      // ── Spaltenreihenfolge-Editor ─────────────────────────────────────────
      const currentColOrder = cfg.column_order?.length ? cfg.column_order : COLUMN_DEFS.map(c => c.key);
      const colSortHtml = `
        <div class="sort-list" id="col-sort-list">
          ${currentColOrder.map((key, idx) => {
            const col = COLUMN_DEFS.find(c => c.key === key);
            if (!col) return '';
            return `
              <div class="sort-row">
                <div class="sort-row-label"><ha-icon icon="${col.icon}"></ha-icon>${col.title}</div>
                <button class="sort-btn" data-move-col="${idx}" data-dir="-1" ${idx === 0 ? 'disabled' : ''} title="Nach oben">↑</button>
                <button class="sort-btn" data-move-col="${idx}" data-dir="1"  ${idx === currentColOrder.length - 1 ? 'disabled' : ''} title="Nach unten">↓</button>
              </div>`;
          }).join('')}
        </div>
        <div class="opt-hint">Gilt für alle Raumansichten. Leere Spalten werden automatisch ausgeblendet.</div>
      `;

      // ── Räume-Bereich ─────────────────────────────────────────────────────
      let areasHtml = '';

      if (this._loading) {
        areasHtml = `<div class="loading"><div class="spinner"></div>Lade Räume und Geräte…</div>`;
      } else if (this._registry) {
        const { areas = [], entities = [], devices = [] } = this._registry;
        const filtered   = R.filterAreas(areas);
        const allAreaIds = filtered.map(a => a.area_id);
        const sorted     = R.sortAreas(filtered, cfg.area_order);

        if (!sorted.length) {
          areasHtml = '<div class="loading">Keine Bereiche gefunden.</div>';
        } else {
          areasHtml = sorted.map((area, areaIdx) => {
            const aId    = area.area_id;
            const isOpen = this._openAreas.has(aId);
            const curTab = this._activeTab.get(aId) || 'devices';
            const aOpts  = cfg.areas_options?.[aId] || {};

            const allByDomain = {};
            const rawEntities = R.filterAvailable(R.filterByLabels(
              R.filterByArea(entities, aId, R.buildDeviceAreaMap(devices))
            ));
            for (const [dom, ents] of R.groupByDomain(rawEntities)) {
              allByDomain[dom] = ents.map(e => e.entity_id);
            }

            let hiddenCount = 0;
            for (const dom of DOMAIN_ORDER) {
              if (allByDomain[dom]) hiddenCount += R.getHiddenEntities(cfg, aId, dom).length;
            }

            const domainBlocks = DOMAIN_ORDER.map(dom => {
              if (!allByDomain[dom]?.length) return '';
              const hiddenNow = R.getHiddenEntities(cfg, aId, dom);
              const allHidden = hiddenNow.length === allByDomain[dom].length;
              const entityRows = allByDomain[dom].map(id => {
                const isHidden = hiddenNow.includes(id);
                const entObj   = entities.find(e => e.entity_id === id);
                const fname    = entObj?.name || entObj?.original_name || '';
                return `
                  <div class="entity-row">
                    <div class="entity-label">
                      ${fname ? `<div class="entity-name">${fname}</div>` : ''}
                      <div class="entity-id-small">${id}</div>
                    </div>
                    <ha-switch data-area="${aId}" data-domain="${dom}" data-entity="${id}" ${!isHidden ? 'checked' : ''}></ha-switch>
                  </div>`;
              }).join('');
              return `
                <div class="domain-block">
                  <div class="domain-header">
                    <div class="domain-header-left"><ha-icon icon="${DOMAIN_ICONS[dom] || 'mdi:dots-horizontal'}"></ha-icon>${DOMAIN_TITLES[dom] || dom}</div>
                    <button class="domain-all-btn" data-area="${aId}" data-domain="${dom}" data-hide="${!allHidden}" data-entities="${allByDomain[dom].join(',')}">${allHidden ? 'Alle einblenden' : 'Alle ausblenden'}</button>
                  </div>
                  ${entityRows}
                </div>`;
            }).join('');

            const allSensors = rawEntities.filter(e => e?.entity_id?.startsWith('sensor.'));
            const sensorDropdowns = PRIMARY_SENSOR_CLASSES.map(sc => {
              const candidates = allSensors.filter(e =>
                e.entity_id.includes(sc.key) ||
                (this._hass?.states[e.entity_id]?.attributes?.device_class === sc.key)
              );
              if (!candidates.length) return '';
              const currentVal = aOpts.primary_sensors?.[sc.key] || '';
              const options = candidates.map(e => {
                const fname = e.name || e.original_name || e.entity_id;
                return `<option value="${e.entity_id}" ${currentVal === e.entity_id ? 'selected' : ''}>${fname} (${e.entity_id})</option>`;
              }).join('');
              return `
                <div class="opt-row">
                  <div class="opt-label"><ha-icon icon="${sc.icon}"></ha-icon>${sc.label}</div>
                  <select class="opt-select" data-area="${aId}" data-sensor-class="${sc.key}">
                    <option value="">– kein führender Sensor –</option>
                    ${options}
                  </select>
                </div>`;
            }).join('');

            const roomOptsHtml = `
              <div class="room-opts">
                <div class="opt-row">
                  <div class="opt-label"><ha-icon icon="mdi:format-title"></ha-icon>Titel-Override</div>
                  <input class="opt-input" type="text" placeholder="${area.name}" value="${aOpts.title_override || ''}" data-area="${aId}" data-opt-key="title_override">
                  <div class="opt-hint">Leer lassen = Bereichsname aus HA</div>
                </div>
                <div class="opt-row">
                  <div class="opt-label"><ha-icon icon="mdi:emoticon"></ha-icon>Icon-Override</div>
                  <input class="opt-input" type="text" placeholder="${area.icon || 'mdi:home'}" value="${aOpts.icon_override || ''}" data-area="${aId}" data-opt-key="icon_override">
                  <div class="opt-hint">z.B. mdi:sofa, mdi:bed, mdi:kitchen</div>
                </div>
                ${sensorDropdowns ? `
                  <div class="opt-row">
                    <div class="opt-label" style="margin-bottom:10px"><ha-icon icon="mdi:star"></ha-icon>Führende Sensoren (Chip-Header)</div>
                    <div class="opt-hint" style="margin-bottom:8px">Werden als Badges im Raum-Header angezeigt.</div>
                    ${sensorDropdowns}
                  </div>` : ''}
                <div class="opt-row">
                  <div class="opt-label"><ha-icon icon="mdi:lightbulb-outline"></ha-icon>Licht-Indikator</div>
                  <select class="opt-select" data-area="${aId}" data-opt-key="light_indicator">
                    <option value="">– automatisch –</option>
                    ${(allByDomain['light'] || []).map(id => {
                      const entObj = entities.find(e => e.entity_id === id);
                      const fname  = entObj?.name || entObj?.original_name || id;
                      return `<option value="${id}" ${aOpts.light_indicator === id ? 'selected' : ''}>${fname}</option>`;
                    }).join('')}
                  </select>
                  <div class="opt-hint">Färbt Raum-Kachel amber wenn Licht an</div>
                </div>
              </div>`;

            return `
              <div class="area-card">
                <div class="area-header${isOpen ? ' open' : ''}" data-area="${aId}">
                  <div class="area-header-left">
                    <ha-icon icon="${aOpts.icon_override || area.icon || 'mdi:home'}"></ha-icon>
                    ${aOpts.title_override || area.name}
                  </div>
                  <div class="area-header-right">
                    <span class="badge${hiddenCount > 0 ? ' visible' : ''}">${hiddenCount} ausgeblendet</span>
                    <button class="area-sort-btn" data-move-area="${aId}" data-dir="-1" data-all-areas="${allAreaIds.join(',')}" ${areaIdx === 0 ? 'disabled' : ''} title="Raum nach oben">↑</button>
                    <button class="area-sort-btn" data-move-area="${aId}" data-dir="1"  data-all-areas="${allAreaIds.join(',')}" ${areaIdx === sorted.length - 1 ? 'disabled' : ''} title="Raum nach unten">↓</button>
                    <ha-icon class="chevron${isOpen ? ' open' : ''}" icon="mdi:chevron-down"></ha-icon>
                  </div>
                </div>
                <div class="area-content${isOpen ? ' open' : ''}" data-area="${aId}">
                  <div class="tabs">
                    <button class="tab-btn${curTab === 'devices' ? ' active' : ''}" data-area="${aId}" data-tab="devices">💡 Geräte</button>
                    <button class="tab-btn${curTab === 'options' ? ' active' : ''}" data-area="${aId}" data-tab="options">⚙️ Raumoptionen</button>
                  </div>
                  <div class="tab-pane${curTab === 'devices' ? ' active' : ''}" data-area="${aId}" data-tab="devices">
                    ${domainBlocks || '<div style="padding:12px 16px;color:var(--secondary-text-color);font-size:13px">Keine Geräte in diesem Raum.</div>'}
                  </div>
                  <div class="tab-pane${curTab === 'options' ? ' active' : ''}" data-area="${aId}" data-tab="options">
                    ${roomOptsHtml}
                  </div>
                </div>
              </div>`;
          }).join('');
        }
      }

      shadow.innerHTML = `
        <style>${EDITOR_STYLES}</style>
        <div class="section-header"><ha-icon icon="mdi:tune"></ha-icon>Allgemein</div>
        <div class="general-row">
          <label>Raum-Übersicht anzeigen<span class="sub">Zeigt alle Bereiche als Kacheln auf der Startseite</span></label>
          <ha-switch id="sw-areas" ${showAreas ? 'checked' : ''}></ha-switch>
        </div>
        <div class="general-row">
          <label>Sicherheits-Widget anzeigen<span class="sub">Schlösser, Türen, Fenster, Alarm</span></label>
          <ha-switch id="sw-security" ${showSecurity ? 'checked' : ''}></ha-switch>
        </div>
        <div class="general-row">
          <label>Batterie-Warnungen anzeigen<span class="sub">Geräte mit niedrigem Akkustand</span></label>
          <ha-switch id="sw-battery" ${showBattery ? 'checked' : ''}></ha-switch>
        </div>

        <div class="section-header" style="margin-top:28px"><ha-icon icon="mdi:view-column"></ha-icon>Spaltenreihenfolge</div>
        ${colSortHtml}

        <div class="section-header" style="margin-top:28px"><ha-icon icon="mdi:home-city"></ha-icon>Räume</div>
        <div id="areas-container">${areasHtml}</div>
        <div class="editor-footer">L30NEYN Dashboard Strategy v${VERSION}</div>
      `;

      shadow.getElementById('sw-areas')   ?.addEventListener('change', e => this._setConfigValue('show_areas',          e.target.checked));
      shadow.getElementById('sw-security')?.addEventListener('change', e => this._setConfigValue('show_security',       e.target.checked));
      shadow.getElementById('sw-battery') ?.addEventListener('change', e => this._setConfigValue('show_battery_status', e.target.checked));

      // Spalten-Sort-Buttons
      shadow.querySelectorAll('.sort-btn[data-move-col]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          this._moveColumn(parseInt(btn.dataset.moveCol), parseInt(btn.dataset.dir));
        });
      });

      // Raum-Sort-Buttons
      shadow.querySelectorAll('.area-sort-btn[data-move-area]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          this._moveArea(btn.dataset.moveArea, parseInt(btn.dataset.dir), btn.dataset.allAreas.split(','));
        });
      });

      shadow.querySelectorAll('.area-header').forEach(h => h.addEventListener('click', () => this._toggleArea(h.dataset.area)));
      shadow.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); this._switchTab(btn.dataset.area, btn.dataset.tab); }));
      shadow.querySelectorAll('.domain-all-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); const { area, domain, hide, entities: ents } = btn.dataset; this._toggleDomainAll(area, domain, ents.split(','), hide === 'true'); }));
      shadow.querySelectorAll('ha-switch[data-entity]').forEach(sw => sw.addEventListener('change', e => { const { area, domain, entity } = e.target.dataset; this._toggleEntityHidden(area, domain, entity, !e.target.checked); }));
      shadow.querySelectorAll('.opt-input[data-opt-key]').forEach(inp => { let t; inp.addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => this._setAreaOption(inp.dataset.area, inp.dataset.optKey, e.target.value.trim()), 400); }); });
      shadow.querySelectorAll('.opt-select[data-opt-key]').forEach(sel => sel.addEventListener('change', e => this._setAreaOption(sel.dataset.area, sel.dataset.optKey, e.target.value)));
      shadow.querySelectorAll('.opt-select[data-sensor-class]').forEach(sel => sel.addEventListener('change', e => this._setPrimarySensor(sel.dataset.area, sel.dataset.sensorClass, e.target.value)));
    }
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 11 — DASHBOARD STRATEGY (Entry Point)
  // ════════════════════════════════════════════════════════════════════════════════

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

        // Räume in konfigurierter Reihenfolge hinzufügen
        const sortedAreas = R.sortAreas(
          registryData.areas.filter(a => a?.area_id && !a.labels?.includes('no_dboard')),
          config.area_order
        );
        for (const area of sortedAreas) {
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
      return { show_areas: true, show_security: true, show_battery_status: true, navigation: {}, areas_options: {}, column_order: [], area_order: [] };
    }
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ════════════════════════════════════════════════════════════════════════════════

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

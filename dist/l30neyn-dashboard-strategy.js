/**
 * L30NEYN Dashboard Strategy
 * @version 2.1.0
 * @license MIT
 */

(function () {
  'use strict';

  const VERSION = '2.1.0';
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
  // MODUL 2b — FLOOR REGISTRY LOADER
  // ════════════════════════════════════════════════════════════════════════════════

  const loadFloors = async (hass) => {
    if (hass.floors) return Object.values(hass.floors);
    try {
      const floors = await callWS(hass, { type: 'config/floor_registry/list' });
      return Array.isArray(floors) ? floors : [];
    } catch (e) {
      console.warn('[L30NEYN] Floor registry not available:', e.message);
      return [];
    }
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 3 — DASHBOARD CONTEXT RESOLVER
  // ════════════════════════════════════════════════════════════════════════════════

  const DashboardContextResolver = {
    async resolve(hass, config) {
      const manual = config?.navigation?.dashboard_url_path;
      if (manual) {
        const clean = String(manual).replace(/^\\/+|\\/+$/g, '');
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

    isAreaHidden: (config, areaId) => config?.areas_options?.[areaId]?.hidden === true,

    filterAreas: (areas) => (areas || []).filter(a => a && !(a.labels?.includes('no_dboard'))),

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

    buildFloorGroups(areas, haFloors, configFloors) {
      if (haFloors && haFloors.length > 0) {
        const sorted = [...haFloors].sort((a, b) => {
          if (a.level != null && b.level != null) return a.level - b.level;
          if (a.level != null) return -1;
          if (b.level != null) return 1;
          return (a.name || '').localeCompare(b.name || '', 'de');
        });
        return sorted.map(floor => ({
          floor_id: floor.floor_id,
          name:     floor.name || floor.floor_id,
          icon:     floor.icon || 'mdi:floor-plan',
          area_ids: areas.filter(a => a.floor_id === floor.floor_id).map(a => a.area_id),
        })).filter(f => f.area_ids.length > 0);
      }
      if (configFloors && configFloors.length > 0) {
        return configFloors.map(f => ({
          floor_id: f.id || f.name,
          name:     f.name || 'Etage',
          icon:     f.icon || 'mdi:floor-plan',
          area_ids: f.area_ids || [],
        })).filter(f => f.area_ids.length > 0);
      }
      return [];
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
    collectBatteries(hass, entities, config) {
      const explicitList = config?.battery_entities;
      let bats;
      if (explicitList?.length) {
        bats = explicitList.filter(id => hass.states[id]).map(id => ({ entity_id: id }));
      } else {
        bats = R.filterAvailable(R.filterByLabels(entities.filter(e => {
          if (!e?.entity_id?.startsWith('sensor.')) return false;
          const s = hass.states[e.entity_id]; if (!s) return false;
          return s.attributes?.device_class === 'battery';
        })));
      }
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

    clock() {
      return {
        type: 'custom:mushroom-title-card',
        title: `{{ now().strftime('%H:%M') }}`,
        subtitle: `{{ now().strftime('%A, %d. %B %Y') }}`,
      };
    },

    calendar(entity) {
      return {
        type: 'calendar',
        entities: [entity],
      };
    },

    roomTitle(area, aOpts) {
      return { type: 'custom:mushroom-title-card', title: aOpts?.title_override || area.name, subtitle: '' };
    },

    roomChipsHeader(area, aOpts, roomEntities, hass) {
      const chips = [];
      chips.push({ type: 'template', icon: aOpts?.icon_override || area.icon || 'mdi:home', icon_color: 'blue', content: aOpts?.title_override || area.name, tap_action: { action: 'none' } });
      const tempId = aOpts?.primary_sensors?.temperature;
      const climId = (roomEntities.climate || [])[0];
      if (tempId && hass.states[tempId]) {
        chips.push({ type: 'template', icon: 'mdi:thermometer', icon_color: 'red', content: `{{ states('${tempId}') | float(0) | round(1) }} °C`, tap_action: { action: 'more-info', entity: tempId } });
      } else if (climId && hass.states[climId]) {
        chips.push({ type: 'template', icon: 'mdi:thermometer', icon_color: 'red', content: `{{ state_attr('${climId}', 'current_temperature') | round(1) }} °C`, tap_action: { action: 'more-info', entity: climId } });
      }
      const humId = aOpts?.primary_sensors?.humidity;
      if (humId && hass.states[humId]) {
        chips.push({ type: 'template', icon: 'mdi:water-percent', icon_color: 'blue', content: `{{ states('${humId}') | float(0) | round(0) }} %`, tap_action: { action: 'more-info', entity: humId } });
      }
      const luxId = aOpts?.primary_sensors?.illuminance;
      if (luxId && hass.states[luxId]) {
        chips.push({ type: 'template', icon: 'mdi:brightness-5', icon_color: 'yellow', content: `{{ states('${luxId}') | float(0) | round(0) }} lx`, tap_action: { action: 'more-info', entity: luxId } });
      }
      const co2Id = aOpts?.primary_sensors?.co2;
      if (co2Id && hass.states[co2Id]) {
        chips.push({ type: 'template', icon: 'mdi:molecule-co2', icon_color: `{{ 'red' if states('${co2Id}') | float(0) > 1200 else ('orange' if states('${co2Id}') | float(0) > 800 else 'green') }}`, content: `{{ states('${co2Id}') | float(0) | round(0) }} ppm`, tap_action: { action: 'more-info', entity: co2Id } });
      }
      const lights = roomEntities.light || [];
      if (lights.length > 0) {
        const idList = lights.map(id => `'${id}'`).join(',');
        chips.push({ type: 'template', icon: 'mdi:lightbulb-group', icon_color: `{{ 'amber' if [${idList}] | select('is_state', 'on') | list | count > 0 else 'grey' }}`, content: `{{ [${idList}] | select('is_state', 'on') | list | count }} / ${lights.length}`, tap_action: { action: 'none' } });
      }
      const covers = roomEntities.cover || [];
      if (covers.length > 0) {
        const idList = covers.map(id => `'${id}'`).join(',');
        chips.push({ type: 'template', icon: 'mdi:window-shutter-open', icon_color: `{{ 'blue' if [${idList}] | select('is_state', 'open') | list | count > 0 else 'grey' }}`, content: `{{ [${idList}] | select('is_state', 'open') | list | count }} / ${covers.length}`, tap_action: { action: 'none' } });
      }
      if (climId && hass.states[climId]) {
        chips.push({ type: 'template', icon: 'mdi:thermostat', icon_color: `{{ 'orange' if is_state('${climId}', 'heat') or is_state('${climId}', 'heat_cool') else 'blue' }}`, content: `{{ state_attr('${climId}', 'temperature') | round(1) }} °C`, tap_action: { action: 'more-info', entity: climId } });
      }
      return { type: 'custom:mushroom-chips-card', chips, alignment: 'start', card_mod: { style: `\n            ha-card {\n              background: none !important;\n              box-shadow: none !important;\n              padding: 4px 0 8px !important;\n            }\n          ` } };
    },

    groupControl(entityIds, domain) {
      const cfg = {
        light: [{ primary: 'Alle an',     icon: 'mdi:lightbulb-group',     icon_color: 'amber',     service: 'light.turn_on'  },
                { primary: 'Alle aus',    icon: 'mdi:lightbulb-group-off', icon_color: 'grey',      service: 'light.turn_off' }],
        cover: [{ primary: 'Alle hoch',   icon: 'mdi:arrow-up-box',        icon_color: 'blue',      service: 'cover.open_cover'  },
                { primary: 'Alle runter', icon: 'mdi:arrow-down-box',      icon_color: 'blue-grey', service: 'cover.close_cover' }],
      };
      if (!cfg[domain]) return null;
      return { type: 'horizontal-stack', cards: cfg[domain].map(b => ({ type: 'custom:mushroom-template-card', primary: b.primary, icon: b.icon, icon_color: b.icon_color, tap_action: { action: 'call-service', service: b.service, service_data: { entity_id: entityIds } }, fill_container: true })) };
    },

    roomButton(area, basePath, config, roomEntities) {
      const aOpts    = config?.areas_options?.[area.area_id] || {};
      const tempId   = aOpts?.primary_sensors?.temperature;
      const humId    = aOpts?.primary_sensors?.humidity;
      const lightInd = aOpts?.light_indicator;
      const lights   = roomEntities?.light || [];
      const covers   = roomEntities?.cover || [];

      let secondary = '';
      if (tempId) {
        secondary = `{{ states('${tempId}') | float(0) | round(1) }} °C`;
        if (humId) secondary += ` · {{ states('${humId}') | float(0) | round(0) }} %`;
      } else if (aOpts?.subtitle) {
        secondary = aOpts.subtitle;
      }

      let badge_icon  = undefined;
      let badge_color = undefined;
      if (lights.length > 0) {
        const idList = lights.map(id => `'${id}'`).join(',');
        badge_icon  = `{{ 'mdi:lightbulb' if [${idList}] | select('is_state','on') | list | count > 0 else 'mdi:lightbulb-off' }}`;
        badge_color = `{{ 'amber' if [${idList}] | select('is_state','on') | list | count > 0 else 'disabled' }}`;
      } else if (covers.length > 0) {
        const idList = covers.map(id => `'${id}'`).join(',');
        badge_icon  = `{{ 'mdi:window-shutter-open' if [${idList}] | select('is_state','open') | list | count > 0 else 'mdi:window-shutter' }}`;
        badge_color = `{{ 'blue' if [${idList}] | select('is_state','open') | list | count > 0 else 'disabled' }}`;
      }

      const holdAction = lights.length > 0
        ? {
            action: 'call-service',
            service: `{{ 'light.turn_off' if [${lights.map(id => `'${id}'`).join(',')}] | select('is_state','on') | list | count > 0 else 'light.turn_on' }}`,
            service_data: { entity_id: lights },
          }
        : covers.length > 0
          ? {
              action: 'call-service',
              service: `{{ 'cover.close_cover' if [${covers.map(id => `'${id}'`).join(',')}] | select('is_state','open') | list | count > 0 else 'cover.open_cover' }}`,
              service_data: { entity_id: covers },
            }
          : { action: 'none' };

      const doubleTapAction = covers.length > 0 && lights.length > 0
        ? {
            action: 'call-service',
            service: `{{ 'cover.close_cover' if [${covers.map(id => `'${id}'`).join(',')}] | select('is_state','open') | list | count > 0 else 'cover.open_cover' }}`,
            service_data: { entity_id: covers },
          }
        : { action: 'none' };

      const card = {
        type: 'custom:mushroom-template-card',
        primary: aOpts.title_override || area.name,
        icon: aOpts.icon_override || area.icon || 'mdi:home',
        icon_color: lightInd
          ? `{{ 'amber' if is_state('${lightInd}', 'on') else 'blue-grey' }}`
          : (lights.length > 0
            ? `{{ 'amber' if [${lights.map(id => `'${id}'`).join(',')}] | select('is_state','on') | list | count > 0 else 'blue-grey' }}`
            : 'blue-grey'),
        secondary,
        tap_action:        { action: 'navigate', navigation_path: NavigationBuilder.room(basePath, area.area_id) },
        hold_action:       holdAction,
        double_tap_action: doubleTapAction,
        fill_container:    true,
      };

      if (badge_icon)  card.badge_icon  = badge_icon;
      if (badge_color) card.badge_color = badge_color;

      return card;
    },
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // MODUL 9 — VIEW BUILDERS
  // ════════════════════════════════════════════════════════════════════════════════

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

  const OVERVIEW_WIDGET_DEFS = [
    { key: 'weather',  title: 'Wetter',   icon: 'mdi:weather-cloudy'    },
    { key: 'clock',    title: 'Uhr',      icon: 'mdi:clock-outline'     },
    { key: 'calendar', title: 'Kalender', icon: 'mdi:calendar-month'    },
  ];

  const resolveWidgetOrder = (config) => {
    const order = config?.overview_widget_order;
    if (!order?.length) return OVERVIEW_WIDGET_DEFS;
    const map = new Map(OVERVIEW_WIDGET_DEFS.map(w => [w.key, w]));
    const sorted = [];
    for (const key of order) { if (map.has(key)) sorted.push(map.get(key)); }
    for (const w of OVERVIEW_WIDGET_DEFS) { if (!sorted.includes(w)) sorted.push(w); }
    return sorted;
  };

  const DOMAIN_ORDER  = ['light','cover','climate','fan','switch','media_player','sensor','binary_sensor','camera'];
  const DOMAIN_TITLES = Object.fromEntries([
    ...COLUMN_DEFS.flatMap(c => c.domains.map(d => [d, c.title])),
    ['fan', 'Ventilatoren'],
  ]);
  const DOMAIN_ICONS = Object.fromEntries([
    ...COLUMN_DEFS.flatMap(c => c.domains.map(d => [d, c.icon])),
    ['fan', 'mdi:fan'],
  ]);

  const SENSOR_CLASSES = new Set(['temperature','humidity','illuminance','battery']);
  const BINARY_SENSOR_CLASSES = new Set(['motion','occupancy','door','window','smoke','moisture','vibration','gas','battery','connectivity','plug','presence']);
  const PRIMARY_SENSOR_CLASSES = [
    { key: 'temperature', label: 'Temperatur',  icon: 'mdi:thermometer',   unit: '°C' },
    { key: 'humidity',    label: 'Luftfeuchte', icon: 'mdi:water-percent', unit: '%'  },
    { key: 'illuminance', label: 'Helligkeit',  icon: 'mdi:brightness-5',  unit: 'lx' },
    { key: 'co2',         label: 'CO₂',         icon: 'mdi:molecule-co2',  unit: 'ppm' },
    { key: 'pm25',        label: 'PM2.5',       icon: 'mdi:air-filter',    unit: 'µg/m³' },
  ];

  const resolveColumnOrder = (config) => {
    const order = config?.column_order;
    if (!order?.length) return COLUMN_DEFS;
    const map = new Map(COLUMN_DEFS.map(c => [c.key, c]));
    const sorted = [];
    for (const key of order) { if (map.has(key)) sorted.push(map.get(key)); }
    for (const col of COLUMN_DEFS) { if (!sorted.includes(col)) sorted.push(col); }
    return sorted;
  };

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
        ids.filter(id => SENSOR_CLASSES.has(hass.states[id]?.attributes?.device_class)).forEach(id => colCards.push(Cards.entity(id)));
      } else if (domain === 'binary_sensor') {
        ids.filter(id => BINARY_SENSOR_CLASSES.has(hass.states[id]?.attributes?.device_class)).forEach(id => colCards.push(Cards.entity(id)));
      } else {
        ids.forEach(id => colCards.push(Cards.entity(id)));
      }
    }
    if (colCards.length <= 1) return null;
    return { type: 'vertical-stack', cards: colCards };
  };

  const detectCalendarEntity = (hass) => {
    return Object.keys(hass.states || {}).find(id => id.startsWith('calendar.')) || null;
  };

  const OverviewView = {
    async generate(hass, config, registry, basePath) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const hour = new Date().getHours();
        const greeting = hour < 6 ? 'Gute Nacht' : hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

        // ════ SPALTE 1: Uhr, Wetter, Kalender ════
        const col1 = [];
        col1.push(Cards.title(greeting, 'Smart Home Übersicht'));

        if (config.show_clock_favorites !== false) {
          const widgetOrder = resolveWidgetOrder(config);
          const weatherEntity = config.weather_entity || Object.keys(hass.states || {}).find(id => id?.startsWith('weather.'));

          for (const widget of widgetOrder) {
            if (widget.key === 'weather') {
              if (weatherEntity) col1.push(Cards.weather(weatherEntity));
            } else if (widget.key === 'clock') {
              col1.push(Cards.clock());
            } else if (widget.key === 'calendar') {
              if (config.calendar_entity !== false) {
                const calEntity = config.calendar_entity || detectCalendarEntity(hass);
                if (calEntity && hass.states[calEntity]) {
                  col1.push(Cards.calendar(calEntity));
                }
              }
            }
          }

          const favEntities = config.favorite_entities || [];
          if (favEntities.length > 0) {
            const favChips = favEntities.slice(0, 6).filter(id => hass.states[id])
              .map(id => ({ type: 'entity', entity: id, tap_action: { action: 'more-info' } }));
            if (favChips.length) col1.push({ type: 'custom:mushroom-chips-card', chips: favChips, alignment: 'center' });
          }
        }

        // ════ SPALTE 2: Räume / Etagen ════
        const col2 = [];

        if (config.show_areas !== false) {
          const deviceAreaMap = R.buildDeviceAreaMap(devices);
          const filteredAreas = R.sortAreas(
            R.filterAreas(areas).filter(a => !R.isAreaHidden(config, a.area_id)),
            config.area_order
          );
          const floorConfig = config.floor_grouping || {};
          const useFloorGrouping = floorConfig.enabled === true;

          const buildRoomCardEntry = (area) => {
            const ae = R.filterAvailable(R.filterByLabels(R.filterByArea(entities, area.area_id, deviceAreaMap)));
            const lights = ae.filter(e => e?.entity_id?.startsWith('light.')).map(e => e.entity_id);
            const covers = ae.filter(e => e?.entity_id?.startsWith('cover.')).map(e => e.entity_id);
            const aOpts = config?.areas_options?.[area.area_id] || {};
            const lightIndicator = aOpts?.light_indicator || lights[0];
            const enrichedConfig = { ...config, areas_options: { ...config?.areas_options, [area.area_id]: { ...aOpts, light_indicator: lightIndicator } } };
            return Cards.roomButton(area, basePath, enrichedConfig, { light: lights, cover: covers });
          };

          if (!useFloorGrouping) {
            if (filteredAreas.length) {
              col2.push({ type: 'grid', cards: filteredAreas.map(buildRoomCardEntry), columns: 2, square: false });
            }
          } else {
            const haFloors = await loadFloors(hass);
            const floorGroups = R.buildFloorGroups(filteredAreas, haFloors, floorConfig.floors);

            if (floorGroups.length === 0) {
              console.warn('[L30NEYN] Floor grouping enabled but no floors found. Showing all areas.');
              col2.push({ type: 'custom:mushroom-title-card', title: 'Alle Räume', subtitle: 'Keine Etagen konfiguriert' });
              col2.push({ type: 'grid', cards: filteredAreas.map(buildRoomCardEntry), columns: 2, square: false });
            } else {
              floorGroups.forEach(floor => {
                const floorAreas = filteredAreas.filter(a => floor.area_ids.includes(a.area_id));
                if (!floorAreas.length) return;
                col2.push(Cards.title(floor.name, '', floor.icon));
                col2.push({ type: 'grid', cards: floorAreas.map(buildRoomCardEntry), columns: 2, square: false });
              });
              const assignedIds = new Set(floorGroups.flatMap(f => f.area_ids));
              const unassigned = filteredAreas.filter(a => !assignedIds.has(a.area_id));
              if (unassigned.length > 0) {
                col2.push(Cards.title('Weitere Räume', '', 'mdi:home-outline'));
                col2.push({ type: 'grid', cards: unassigned.map(buildRoomCardEntry), columns: 2, square: false });
              }
            }
          }
        }

        if (config.show_domain_overviews !== false) {
          (config.domain_groups || []).forEach(group => {
            const { title, domains, entity_filter } = group;
            const groupEntities = [];
            domains.forEach(domain => {
              entities.filter(e => {
                if (!e?.entity_id?.startsWith(`${domain}.`)) return false;
                if (!hass.states[e.entity_id]) return false;
                if (entity_filter && !e.entity_id.includes(entity_filter)) return false;
                return true;
              }).forEach(e => groupEntities.push(e.entity_id));
            });
            if (!groupEntities.length) return;
            col2.push(Cards.title(title || 'Gruppe', `${groupEntities.length} Geräte`));
            col2.push({ type: 'grid', cards: groupEntities.slice(0, 20).map(id => {
              const d = id.split('.')[0];
              if (d === 'light') return Cards.light(id);
              if (d === 'cover') return Cards.cover(id);
              if (d === 'climate') return Cards.climate(id);
              return Cards.entity(id);
            }), columns: 2, square: false });
          });
        }

        // ════ SPALTE 3: Sicherheit & Batterie-Indikatoren ════
        const col3 = [];

        if (config.show_security !== false) {
          const sec = Collectors.collectSecurity(hass, entities);
          if (sec.locks.length || sec.doors.length || sec.windows.length || sec.alarm) {
            col3.push(Cards.title('Sicherheit'));
            const secCards = [];
            if (sec.alarm)          secCards.push(Cards.entity(sec.alarm));
            sec.locks  .forEach(id => secCards.push(Cards.entity(id)));
            sec.doors  .forEach(id => secCards.push(Cards.entity(id)));
            sec.windows.forEach(id => secCards.push(Cards.entity(id)));
            col3.push({ type: 'grid', cards: secCards, columns: 2, square: false });
          }
        }

        if (config.show_battery_status !== false) {
          const bats = Collectors.collectBatteries(hass, entities, config);
          if (bats.critical.length || bats.low.length) {
            col3.push(Cards.title('Batterie-Warnung'));
            bats.critical.forEach(id => col3.push(Cards.entity(id, { icon_color: 'red' })));
            bats.low     .forEach(id => col3.push(Cards.entity(id, { icon_color: 'orange' })));
          }
        }

        // ════ 3-SPALTEN LAYOUT zusammenbauen ════
        const col1Stack = { type: 'vertical-stack', cards: col1 };
        const col2Stack = col2.length ? { type: 'vertical-stack', cards: col2 } : null;
        const col3Stack = col3.length ? { type: 'vertical-stack', cards: col3 } : null;

        const columns = [col1Stack, col2Stack, col3Stack].filter(Boolean);
        const layoutCard = columns.length > 1
          ? { type: 'horizontal-stack', cards: columns }
          : col1Stack;

        return { title: 'Übersicht', path: 'overview', icon: 'mdi:home', cards: [layoutCard] };
      } catch (e) {
        return { title: 'Übersicht', path: 'overview', icon: 'mdi:home', cards: [Cards.error(e.message)] };
      }
    },
  };
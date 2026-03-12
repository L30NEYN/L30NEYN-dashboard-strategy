/**
 * L30NEYN Dashboard Strategy
 * @version 1.3.4
 * @license MIT
 */

const VERSION = '1.3.4';

console.info('[L30NEYN] Loading dashboard strategy v' + VERSION);

// ─── WEBSOCKET HELPER ───────────────────────────────────────────────────────────────────────

const callWS = async (hass, message) => {
  // Versuche zuerst hass.callWS (Standard)
  if (typeof hass.callWS === 'function') {
    return await hass.callWS(message);
  }
  // Fallback: hass.connection.sendMessagePromise
  if (hass.connection && typeof hass.connection.sendMessagePromise === 'function') {
    return await hass.connection.sendMessagePromise(message);
  }
  throw new Error('No WebSocket method available on hass object');
};

// ─── REGISTRY DATA LOADER ───────────────────────────────────────────────────────────────────

const loadRegistryData = async (hass) => {
  // Prüfe ob hass vollständig ist
  if (!hass) {
    throw new Error('HASS object is null or undefined');
  }

  // Option 1: Nutze gecachte Registry-Daten (schnellste Methode)
  const cachedAreas = hass.areas ? Object.values(hass.areas) : [];
  const cachedDevices = hass.devices ? Object.values(hass.devices) : [];
  const cachedEntities = hass.entities ? Object.values(hass.entities) : [];

  if (cachedAreas.length > 0 || cachedDevices.length > 0 || cachedEntities.length > 0) {
    console.info('[L30NEYN] Using cached registry data from hass object');
    console.info(`[L30NEYN] Cached: ${cachedAreas.length} areas, ${cachedDevices.length} devices, ${cachedEntities.length} entities`);
    return {
      areas: cachedAreas,
      devices: cachedDevices,
      entities: cachedEntities,
      source: 'cached'
    };
  }

  // Option 2: Lade über WebSocket (wenn keine gecachten Daten verfügbar)
  console.info('[L30NEYN] No cached data available, loading via WebSocket...');
  
  try {
    const [areas, devices, entities] = await Promise.all([
      callWS(hass, { type: 'config/area_registry/list' }),
      callWS(hass, { type: 'config/device_registry/list' }),
      callWS(hass, { type: 'config/entity_registry/list' }),
    ]);
    
    console.info(`[L30NEYN] Loaded via WebSocket: ${areas.length} areas, ${devices.length} devices, ${entities.length} entities`);
    
    return {
      areas: areas || [],
      devices: devices || [],
      entities: entities || [],
      source: 'websocket'
    };
  } catch (wsError) {
    console.warn('[L30NEYN] WebSocket loading failed:', wsError.message);
    
    // Option 3: Letzte Notfall-Fallback - leere Daten mit Fehlermeldung
    return {
      areas: [],
      devices: [],
      entities: [],
      source: 'error',
      error: wsError.message
    };
  }
};

// ─── HELPERS ────────────────────────────────────────────────────────────────────────────────────

const L30NEYNHelpers = {
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
};

// ─── CARD BUILDERS ──────────────────────────────────────────────────────────────────────────────

const L30NEYNCardBuilders = {
  buildEntitiesCard(entities, options = {}) {
    return { type: 'entities', entities, ...options };
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
  buildErrorCard(error, details = '') {
    const troubleshooting = `
## Fehlerbehebung

1. **Seite neu laden** (F5 oder Strg+R)
2. **Cache leeren** (Strg+Shift+R)
3. **Browser-Konsole prüfen** (F12 → Console)
4. **Home Assistant neu starten**

### Technische Details
\`\`\`
${details}
\`\`\`

### Support
Bei weiteren Problemen öffne ein Issue auf:
[GitHub Repository](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues)
    `.trim();

    return {
      type: 'markdown',
      content: `# ⚠️ Dashboard Fehler\n\n**${error}**\n\n${troubleshooting}`
    };
  }
};

// ─── DATA COLLECTORS ────────────────────────────────────────────────────────────────────────────

const L30NEYNDataCollectors = {
  collectLights(hass, entities) {
    const h = L30NEYNHelpers;
    const lights = h.filterAvailable(h.filterByLabels(entities.filter(e => e?.entity_id?.startsWith('light.'))));
    const on = [], off = [];
    lights.forEach(e => {
      const s = hass.states[e.entity_id]; if (!s) return;
      s.state === 'on' ? on.push(e.entity_id) : off.push(e.entity_id);
    });
    return { on, off };
  },
  collectSecurity(hass, entities) {
    const h = L30NEYNHelpers;
    const DOMAINS = new Set(['lock','binary_sensor','alarm_control_panel','cover']);
    const sec = h.filterAvailable(h.filterByLabels(entities.filter(e => e?.entity_id && DOMAINS.has(e.entity_id.split('.')[0]))));
    const locks = [], doors = [], windows = [];
    let alarm = null;
    sec.forEach(e => {
      const s = hass.states[e.entity_id]; if (!s) return;
      const d = e.entity_id.split('.')[0];
      if (d === 'lock') locks.push(e.entity_id);
      else if (d === 'alarm_control_panel') alarm = e.entity_id;
      else if (d === 'binary_sensor') {
        const dc = s.attributes?.device_class;
        if (dc === 'door' || dc === 'garage_door') doors.push(e.entity_id);
        else if (dc === 'window') windows.push(e.entity_id);
      }
    });
    return { locks, doors, windows, alarm };
  },
  collectBatteries(hass, entities) {
    const h = L30NEYNHelpers;
    const bats = h.filterAvailable(h.filterByLabels(entities.filter(e => {
      if (!e?.entity_id?.startsWith('sensor.')) return false;
      const s = hass.states[e.entity_id]; if (!s) return false;
      return s.attributes?.device_class === 'battery';
    })));
    const critical = [], low = [];
    bats.forEach(e => {
      const s = hass.states[e.entity_id]; if (!s) return;
      const v = parseFloat(s.state); if (isNaN(v)) return;
      if (v < 20) critical.push(e.entity_id);
      else if (v < 50) low.push(e.entity_id);
    });
    return { critical, low };
  },
  collectRoomEntities(areaId, hass, entities, devices) {
    const h = L30NEYNHelpers;
    const deviceAreaMap = h.buildDeviceAreaMap(devices);
    const ae = h.filterAvailable(h.filterByLabels(h.filterByArea(entities, areaId, deviceAreaMap)));
    const domainGroups = h.groupByDomain(ae);
    const result = {};
    for (const [domain, ents] of domainGroups) {
      result[domain] = ents.map(e => e.entity_id);
    }
    return result;
  },
};

// ─── OVERVIEW VIEW ──────────────────────────────────────────────────────────────────────────────

const L30NEYNOverviewView = {
  generate(hass, config, registry) {
    try {
      const { entities = [], devices = [], areas = [] } = registry;
      const cards = [];
      if (config.show_welcome !== false) {
        cards.push({ type: 'markdown', content: `# Willkommen\n\n${this._greeting()}` });
      }
      const weatherEntity = config.weather_entity || Object.keys(hass.states || {}).find(id => id?.startsWith('weather.'));
      if (weatherEntity) cards.push(L30NEYNCardBuilders.buildWeatherCard(weatherEntity));
      if (config.show_areas !== false) {
        const areaCards = this._areaCards(areas, hass, entities, devices);
        if (areaCards.length) cards.push({ type: 'grid', cards: areaCards, columns: 3 });
      }
      if (config.show_security !== false) {
        const sec = L30NEYNDataCollectors.collectSecurity(hass, entities);
        if (sec.locks.length || sec.doors.length || sec.windows.length || sec.alarm)
          cards.push(L30NEYNCardBuilders.buildSecurityCard(sec));
      }
      if (config.show_light_summary !== false) {
        const lights = L30NEYNDataCollectors.collectLights(hass, entities);
        cards.push({ type: 'entities', title: 'Beleuchtung', entities: [
          { type: 'attribute', entity: 'sun.sun', attribute: 'next_rising', name: 'Lichter an', format: 'total', suffix: ` (${lights.on.length})` },
          { type: 'attribute', entity: 'sun.sun', attribute: 'next_setting', name: 'Lichter aus', format: 'total', suffix: ` (${lights.off.length})` },
        ] });
      }
      if (config.show_battery_status !== false) {
        const bats = L30NEYNDataCollectors.collectBatteries(hass, entities);
        if (bats.critical.length || bats.low.length)
          cards.push(L30NEYNCardBuilders.buildBatteryCard(bats.critical, bats.low));
      }
      if (!cards.length) cards.push({ type: 'markdown', content: 'Dashboard wird geladen...' });
      return { title: 'Übersicht', path: 'overview', icon: 'mdi:home', cards };
    } catch (e) {
      console.error('[L30NEYN] OverviewView error:', e);
      return { title: 'Übersicht', path: 'overview', icon: 'mdi:home', cards: [{ type: 'markdown', content: `Fehler: ${e.message}` }] };
    }
  },
  _areaCards(areas, hass, entities, devices) {
    const h = L30NEYNHelpers;
    const deviceAreaMap = h.buildDeviceAreaMap(devices);
    return (areas || []).filter(a => a && !(a.labels?.includes('no_dboard'))).map(area => {
      const ae = h.filterAvailable(h.filterByLabels(h.filterByArea(entities, area.area_id, deviceAreaMap)));
      const lights = ae.filter(e => e?.entity_id?.startsWith('light.'));
      return {
        type: 'button', name: area.name, icon: area.icon || 'mdi:home',
        tap_action: { action: 'navigate', navigation_path: `/lovelace/${area.area_id}` },
        entity: lights[0]?.entity_id,
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

// ─── ROOM VIEW ──────────────────────────────────────────────────────────────────────────────────

const DOMAIN_ORDER = ['light','cover','climate','fan','switch','media_player','sensor','binary_sensor','camera'];
const DOMAIN_TITLES = {
  light: 'Beleuchtung', cover: 'Rollos & Vorhänge', climate: 'Klima',
  fan: 'Ventilatoren', switch: 'Schalter', media_player: 'Medien',
  sensor: 'Sensoren', binary_sensor: 'Status', camera: 'Kameras',
};

const L30NEYNRoomView = {
  generate(areaId, hass, config, registry) {
    try {
      const { entities = [], devices = [], areas = [] } = registry;
      const area = areas.find(a => a?.area_id === areaId);
      if (!area) return { title: areaId, path: areaId, cards: [{ type: 'markdown', content: 'Raum nicht gefunden.' }] };
      const roomEntities = L30NEYNDataCollectors.collectRoomEntities(areaId, hass, entities, devices);
      const cards = [];
      if (roomEntities.light?.length > 1) cards.push(L30NEYNCardBuilders.buildGroupControlCard(roomEntities.light, 'light'));
      if (roomEntities.cover?.length > 1) cards.push(L30NEYNCardBuilders.buildGroupControlCard(roomEntities.cover, 'cover'));
      for (const domain of DOMAIN_ORDER) {
        if (!roomEntities[domain]?.length) continue;
        const title = DOMAIN_TITLES[domain] || domain;
        if (domain === 'sensor' || domain === 'binary_sensor') {
          const relevant = roomEntities[domain].filter(id => {
            const s = hass.states[id];
            return ['temperature','humidity','illuminance','motion','occupancy','door','window'].includes(s?.attributes?.device_class);
          });
          if (relevant.length) cards.push(L30NEYNCardBuilders.buildEntitiesCard(relevant, { title }));
        } else {
          cards.push(L30NEYNCardBuilders.buildEntitiesCard(roomEntities[domain], { title }));
        }
      }
      return {
        title: area.name, path: areaId, icon: area.icon || 'mdi:home',
        cards: cards.length ? cards : [{ type: 'markdown', content: 'Keine Geräte in diesem Raum.' }],
      };
    } catch (e) {
      console.error(`[L30NEYN] RoomView error for ${areaId}:`, e);
      return { title: areaId, path: areaId, icon: 'mdi:home', cards: [{ type: 'markdown', content: `Fehler: ${e.message}` }] };
    }
  },
};

// ─── DASHBOARD STRATEGY ─────────────────────────────────────────────────────────────────────────

class L30NEYNDashboardStrategy {
  static async generate(config, hass) {
    try {
      console.info(`[L30NEYN] Generating dashboard v${VERSION}`);
      console.info('[L30NEYN] Config:', config);
      
      // Debug-Info über verfügbare HASS-Methoden
      console.info('[L30NEYN] HASS object analysis:', {
        hasCallWS: typeof hass?.callWS === 'function',
        hasConnection: !!hass?.connection,
        hasSendMessage: typeof hass?.connection?.sendMessagePromise === 'function',
        hasCachedAreas: !!hass?.areas,
        hasCachedDevices: !!hass?.devices,
        hasCachedEntities: !!hass?.entities,
        hasStates: !!hass?.states
      });
      
      // Lade Registry-Daten mit intelligentem Fallback
      const registryData = await loadRegistryData(hass);
      
      // Prüfe ob Daten erfolgreich geladen wurden
      if (registryData.source === 'error') {
        console.error('[L30NEYN] Failed to load registry data');
        return {
          views: [{
            title: 'Fehler',
            path: 'overview',
            icon: 'mdi:alert-circle',
            cards: [
              L30NEYNCardBuilders.buildErrorCard(
                'Registry-Daten konnten nicht geladen werden',
                `Datenquelle: ${registryData.source}\nFehler: ${registryData.error || 'Unbekannt'}\n\nBitte Seite neu laden (F5)`
              )
            ]
          }]
        };
      }
      
      console.info(`[L30NEYN] Registry data loaded from: ${registryData.source}`);
      console.info(`[L30NEYN] Data: ${registryData.areas.length} areas, ${registryData.devices.length} devices, ${registryData.entities.length} entities`);
      
      const registry = {
        areas: registryData.areas,
        devices: registryData.devices,
        entities: registryData.entities
      };
      
      const views = [];
      
      // Overview View
      views.push(L30NEYNOverviewView.generate(hass, config, registry));
      
      // Room Views
      for (const area of registryData.areas) {
        if (!area?.area_id) continue;
        if (area.labels?.includes('no_dboard')) continue;
        views.push(L30NEYNRoomView.generate(area.area_id, hass, config, registry));
      }
      
      console.info(`[L30NEYN] Dashboard generated successfully with ${views.length} views`);
      return { views };
      
    } catch (e) {
      console.error('[L30NEYN] Critical error during generation:', e);
      console.error('[L30NEYN] Stack trace:', e.stack);
      
      return {
        views: [{
          title: 'Kritischer Fehler',
          path: 'overview',
          icon: 'mdi:alert-octagon',
          cards: [
            L30NEYNCardBuilders.buildErrorCard(
              'Dashboard-Generierung fehlgeschlagen',
              `Fehler: ${e.message}\n\nStack Trace:\n${e.stack || 'Nicht verfügbar'}`
            )
          ]
        }]
      };
    }
  }
}

// ─── REGISTER ───────────────────────────────────────────────────────────────────────────────────

console.info('[L30NEYN] Registering strategy as: ll-strategy-l30neyn-dashboard-strategy');

try {
  customElements.define('ll-strategy-l30neyn-dashboard-strategy', L30NEYNDashboardStrategy);
  console.info('[L30NEYN] Strategy registered successfully!');
} catch (e) {
  console.error('[L30NEYN] Registration failed:', e);
}

console.info(
  `%c L30NEYN-DASHBOARD %c v${VERSION} `,
  'background:#41BDF5;color:#fff;font-weight:bold;padding:3px 5px;',
  'background:#4CAF50;color:#fff;font-weight:bold;padding:3px 5px;'
);

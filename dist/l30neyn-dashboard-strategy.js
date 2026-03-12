/**
 * L30NEYN Dashboard Strategy
 * @version 1.4.0
 * @license MIT
 *
 * WICHTIG: Dieses Script ist bewusst KEIN ES-Modul.
 * Durch IIFE-Wrapping wird customElements.define() synchron beim Parsen ausgefuehrt.
 */

(function () {
  'use strict';

  const VERSION = '1.4.0';
  console.info('[L30NEYN] Loading dashboard strategy v' + VERSION);

  // ─── WEBSOCKET HELPER ──────────────────────────────────────────────────────

  const callWS = async (hass, message) => {
    if (typeof hass.callWS === 'function') return await hass.callWS(message);
    if (hass.connection?.sendMessagePromise) return await hass.connection.sendMessagePromise(message);
    throw new Error('No WebSocket method available on hass object');
  };

  // ─── REGISTRY DATA LOADER ──────────────────────────────────────────────────

  const loadRegistryData = async (hass) => {
    if (!hass) throw new Error('HASS object is null or undefined');
    const cachedAreas    = hass.areas    ? Object.values(hass.areas)    : [];
    const cachedDevices  = hass.devices  ? Object.values(hass.devices)  : [];
    const cachedEntities = hass.entities ? Object.values(hass.entities) : [];
    if (cachedAreas.length > 0 || cachedDevices.length > 0 || cachedEntities.length > 0) {
      console.info('[L30NEYN] Using cached registry data');
      console.info(`[L30NEYN] Cached: ${cachedAreas.length} areas, ${cachedDevices.length} devices, ${cachedEntities.length} entities`);
      return { areas: cachedAreas, devices: cachedDevices, entities: cachedEntities, source: 'cached' };
    }
    console.info('[L30NEYN] No cached data, loading via WebSocket...');
    try {
      const [areas, devices, entities] = await Promise.all([
        callWS(hass, { type: 'config/area_registry/list' }),
        callWS(hass, { type: 'config/device_registry/list' }),
        callWS(hass, { type: 'config/entity_registry/list' }),
      ]);
      return { areas: areas || [], devices: devices || [], entities: entities || [], source: 'websocket' };
    } catch (wsError) {
      console.warn('[L30NEYN] WebSocket loading failed:', wsError.message);
      return { areas: [], devices: [], entities: [], source: 'error', error: wsError.message };
    }
  };

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  const H = {
    filterByLabels(entities) {
      return entities.filter(e => e?.entity_id && !(e.labels?.includes('no_dboard')));
    },
    filterByArea(entities, areaId, deviceAreaMap) {
      return entities.filter(e => {
        if (!e?.entity_id) return false;
        if (e.area_id === areaId) return true;
        if (e.device_id) return deviceAreaMap.get(e.device_id) === areaId;
        return false;
      });
    },
    filterAvailable(entities) {
      return entities.filter(e => e?.entity_id && !e.disabled_by && !e.hidden_by && !e.entity_category);
    },
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
    getAreaConfig(config, areaId) {
      return config?.areas_options?.[areaId] || {};
    },
    getHiddenEntities(config, areaId, domain) {
      return config?.areas_options?.[areaId]?.groups_options?.[domain]?.hidden || [];
    },
    getDashboardPath(config) {
      // Nutze konfigurierten Pfad, oder versuche aktuellen Pfad aus URL zu lesen
      if (config?.dashboard_path) return '/' + config.dashboard_path;
      const pathParts = window.location.pathname.split('/');
      // z.B. /dashboard-dfghdgh/0 → dashboard-dfghdgh
      if (pathParts[1] && pathParts[1] !== 'lovelace') return '/' + pathParts[1];
      return '/lovelace';
    },
  };

  // ─── MUSHROOM CARD BUILDERS ────────────────────────────────────────────────

  const Cards = {
    // Mushroom Light Card
    light(entityId) {
      return {
        type: 'custom:mushroom-light-card',
        entity: entityId,
        show_brightness_control: true,
        show_color_control: true,
        show_color_temp_control: true,
        collapsible_controls: true,
        fill_container: false,
      };
    },
    // Mushroom Cover Card
    cover(entityId) {
      return {
        type: 'custom:mushroom-cover-card',
        entity: entityId,
        show_position_control: true,
        show_tilt_position_control: false,
        show_buttons_control: true,
        fill_container: false,
      };
    },
    // Mushroom Climate Card
    climate(entityId) {
      return {
        type: 'custom:mushroom-climate-card',
        entity: entityId,
        show_temperature_control: true,
        collapsible_controls: true,
        fill_container: false,
      };
    },
    // Mushroom Fan Card
    fan(entityId) {
      return {
        type: 'custom:mushroom-fan-card',
        entity: entityId,
        show_percentage_control: true,
        show_oscillate_control: true,
        collapsible_controls: true,
        fill_container: false,
      };
    },
    // Mushroom Entity Card (Switch, allgemein)
    entity(entityId, options = {}) {
      return {
        type: 'custom:mushroom-entity-card',
        entity: entityId,
        fill_container: false,
        ...options,
      };
    },
    // Mushroom Media Player Card
    mediaPlayer(entityId) {
      return {
        type: 'custom:mushroom-media-player-card',
        entity: entityId,
        use_media_info: true,
        show_volume_level: true,
        media_controls: ['on_off', 'play_pause', 'previous', 'next'],
        volume_controls: ['volume_mute', 'volume_set', 'volume_buttons'],
        collapsible_controls: true,
        fill_container: false,
      };
    },
    // Chips fuer Raum-Uebersicht (Lichter, Cover)
    chips(entities, hass) {
      const chips = [];
      const lights = entities.filter(e => e.startsWith('light.'));
      if (lights.length) {
        chips.push({ type: 'light', entity: lights[0], show_brightness: true });
      }
      return chips.length ? [
        { type: 'custom:mushroom-chips-card', chips }
      ] : [];
    },
    // Trennlinie mit Titel
    section(label) {
      return { type: 'custom:mushroom-title-card', title: label, subtitle: '' };
    },
    // Fehler-Card
    error(error, details = '') {
      return {
        type: 'markdown',
        content: `# ⚠️ Dashboard Fehler\n\n**${error}**\n\n## Fehlerbehebung\n1. **Seite neu laden** (F5 oder Strg+R)\n2. **Cache leeren** (Strg+Shift+R)\n3. **Browser-Konsole pruefen** (F12 → Console)\n4. **Home Assistant neu starten**\n\n### Details\n\`\`\`\n${details}\n\`\`\``
      };
    },
    // Wetter
    weather(entity) {
      return { type: 'weather-forecast', entity, show_forecast: true };
    },
    // Raum-Button (Mushroom Template Card als Nav-Button)
    roomButton(area, dashboardPath, lightEntity) {
      return {
        type: 'custom:mushroom-template-card',
        primary: area.name,
        icon: area.icon || 'mdi:home',
        icon_color: lightEntity ? '{{ "amber" if is_state("' + lightEntity + '", "on") else "grey" }}' : 'grey',
        tap_action: { action: 'navigate', navigation_path: `${dashboardPath}/${area.area_id}` },
        fill_container: false,
      };
    },
    // Gruppen-Steuerung (Mushroom)
    groupControl(entities, domain) {
      if (domain === 'light') {
        return {
          type: 'horizontal-stack',
          cards: [
            {
              type: 'custom:mushroom-template-card',
              primary: 'Alle an',
              icon: 'mdi:lightbulb-group',
              icon_color: 'amber',
              tap_action: { action: 'call-service', service: 'light.turn_on', service_data: { entity_id: entities } },
              fill_container: true,
            },
            {
              type: 'custom:mushroom-template-card',
              primary: 'Alle aus',
              icon: 'mdi:lightbulb-group-off',
              icon_color: 'grey',
              tap_action: { action: 'call-service', service: 'light.turn_off', service_data: { entity_id: entities } },
              fill_container: true,
            },
          ],
        };
      }
      if (domain === 'cover') {
        return {
          type: 'horizontal-stack',
          cards: [
            {
              type: 'custom:mushroom-template-card',
              primary: 'Alle hoch',
              icon: 'mdi:arrow-up-box',
              icon_color: 'blue',
              tap_action: { action: 'call-service', service: 'cover.open_cover', service_data: { entity_id: entities } },
              fill_container: true,
            },
            {
              type: 'custom:mushroom-template-card',
              primary: 'Alle runter',
              icon: 'mdi:arrow-down-box',
              icon_color: 'blue-grey',
              tap_action: { action: 'call-service', service: 'cover.close_cover', service_data: { entity_id: entities } },
              fill_container: true,
            },
          ],
        };
      }
      return null;
    },
  };

  // ─── DATA COLLECTORS ───────────────────────────────────────────────────────

  const Collectors = {
    collectRoomEntities(areaId, hass, entities, devices, config) {
      const deviceAreaMap = H.buildDeviceAreaMap(devices);
      let ae = H.filterAvailable(H.filterByLabels(H.filterByArea(entities, areaId, deviceAreaMap)));
      const result = {};
      for (const [domain, ents] of H.groupByDomain(ae)) {
        const hidden = H.getHiddenEntities(config, areaId, domain);
        const filtered = H.filterHidden(ents, hidden);
        if (filtered.length) result[domain] = filtered.map(e => e.entity_id);
      }
      return result;
    },
    collectSecurity(hass, entities) {
      const DOMAINS = new Set(['lock', 'binary_sensor', 'alarm_control_panel']);
      const sec = H.filterAvailable(H.filterByLabels(entities.filter(e => e?.entity_id && DOMAINS.has(e.entity_id.split('.')[0]))));
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
      const bats = H.filterAvailable(H.filterByLabels(entities.filter(e => {
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
  };

  // ─── OVERVIEW VIEW ─────────────────────────────────────────────────────────

  const DOMAIN_ORDER  = ['light', 'cover', 'climate', 'fan', 'switch', 'media_player', 'sensor', 'binary_sensor', 'camera'];
  const DOMAIN_TITLES = {
    light: 'Beleuchtung', cover: 'Rollos & Vorhaenge', climate: 'Klima',
    fan: 'Ventilatoren', switch: 'Schalter', media_player: 'Medien',
    sensor: 'Sensoren', binary_sensor: 'Status', camera: 'Kameras',
  };

  const OverviewView = {
    generate(hass, config, registry) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const dashboardPath = H.getDashboardPath(config);
        const cards = [];

        // Greeting
        const hour = new Date().getHours();
        const greeting = hour < 6 ? 'Gute Nacht' : hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
        cards.push({ type: 'custom:mushroom-title-card', title: greeting, subtitle: 'Willkommen im Smart Home' });

        // Wetter
        const weatherEntity = config.weather_entity || Object.keys(hass.states || {}).find(id => id?.startsWith('weather.'));
        if (weatherEntity) cards.push(Cards.weather(weatherEntity));

        // Raum-Buttons Grid
        if (config.show_areas !== false) {
          const deviceAreaMap = H.buildDeviceAreaMap(devices);
          const filteredAreas = areas.filter(a => a && !(a.labels?.includes('no_dboard')));
          if (filteredAreas.length) {
            const areaButtons = filteredAreas.map(area => {
              const ae = H.filterAvailable(H.filterByLabels(H.filterByArea(entities, area.area_id, deviceAreaMap)));
              const lights = ae.filter(e => e?.entity_id?.startsWith('light.'));
              return Cards.roomButton(area, dashboardPath, lights[0]?.entity_id);
            });
            cards.push({ type: 'grid', cards: areaButtons, columns: 3, square: false });
          }
        }

        // Sicherheit
        if (config.show_security !== false) {
          const sec = Collectors.collectSecurity(hass, entities);
          if (sec.locks.length || sec.doors.length || sec.windows.length || sec.alarm) {
            const secEntities = [];
            if (sec.alarm) secEntities.push(Cards.entity(sec.alarm));
            if (sec.locks.length) {
              secEntities.push(Cards.section('Schloesser'));
              sec.locks.forEach(id => secEntities.push(Cards.entity(id)));
            }
            if (sec.doors.length) {
              secEntities.push(Cards.section('Tueren'));
              sec.doors.forEach(id => secEntities.push(Cards.entity(id)));
            }
            if (sec.windows.length) {
              secEntities.push(Cards.section('Fenster'));
              sec.windows.forEach(id => secEntities.push(Cards.entity(id)));
            }
            cards.push({ type: 'custom:mushroom-title-card', title: 'Sicherheit', subtitle: '' });
            cards.push({ type: 'grid', cards: secEntities, columns: 2, square: false });
          }
        }

        // Batterie-Status
        if (config.show_battery_status !== false) {
          const bats = Collectors.collectBatteries(hass, entities);
          if (bats.critical.length || bats.low.length) {
            cards.push(Cards.section('Batterie-Warnung'));
            if (bats.critical.length) bats.critical.forEach(id => cards.push(Cards.entity(id, { icon_color: 'red' })));
            if (bats.low.length)      bats.low.forEach(id => cards.push(Cards.entity(id, { icon_color: 'orange' })));
          }
        }

        if (!cards.length) cards.push({ type: 'markdown', content: 'Dashboard wird geladen...' });
        return { title: 'Uebersicht', path: 'overview', icon: 'mdi:home', cards };
      } catch (e) {
        console.error('[L30NEYN] OverviewView error:', e);
        return { title: 'Uebersicht', path: 'overview', icon: 'mdi:home', cards: [Cards.error(e.message)] };
      }
    },
  };

  // ─── ROOM VIEW ─────────────────────────────────────────────────────────────

  const RoomView = {
    generate(areaId, hass, config, registry) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const area = areas.find(a => a?.area_id === areaId);
        if (!area) return { title: areaId, path: areaId, cards: [Cards.error('Raum nicht gefunden: ' + areaId)] };

        const roomEntities = Collectors.collectRoomEntities(areaId, hass, entities, devices, config);
        const allEntityIds = Object.values(roomEntities).flat();
        const cards = [];

        // Raum-Titel
        const lightsOn = (roomEntities.light || []).filter(id => hass.states[id]?.state === 'on').length;
        const totalLights = (roomEntities.light || []).length;
        const subtitle = totalLights ? `${lightsOn} von ${totalLights} Lichtern an` : '';
        cards.push({ type: 'custom:mushroom-title-card', title: area.name, subtitle, icon: area.icon || 'mdi:home' });

        // Gruppen-Steuerung
        if ((roomEntities.light || []).length > 1) {
          const gc = Cards.groupControl(roomEntities.light, 'light');
          if (gc) cards.push(gc);
        }
        if ((roomEntities.cover || []).length > 1) {
          const gc = Cards.groupControl(roomEntities.cover, 'cover');
          if (gc) cards.push(gc);
        }

        // Domain-Cards
        for (const domain of DOMAIN_ORDER) {
          if (!roomEntities[domain]?.length) continue;
          const title = DOMAIN_TITLES[domain] || domain;
          cards.push(Cards.section(title));

          if (domain === 'light') {
            roomEntities[domain].forEach(id => cards.push(Cards.light(id)));
          } else if (domain === 'cover') {
            roomEntities[domain].forEach(id => cards.push(Cards.cover(id)));
          } else if (domain === 'climate') {
            roomEntities[domain].forEach(id => cards.push(Cards.climate(id)));
          } else if (domain === 'fan') {
            roomEntities[domain].forEach(id => cards.push(Cards.fan(id)));
          } else if (domain === 'media_player') {
            roomEntities[domain].forEach(id => cards.push(Cards.mediaPlayer(id)));
          } else if (domain === 'sensor' || domain === 'binary_sensor') {
            const relevant = roomEntities[domain].filter(id => {
              const s = hass.states[id];
              return ['temperature', 'humidity', 'illuminance', 'motion', 'occupancy', 'door', 'window', 'battery'].includes(s?.attributes?.device_class);
            });
            if (relevant.length) relevant.forEach(id => cards.push(Cards.entity(id)));
            else continue; // Section nicht anzeigen wenn keine relevanten Entities
          } else {
            roomEntities[domain].forEach(id => cards.push(Cards.entity(id)));
          }
        }

        return {
          title: area.name,
          path: areaId,
          icon: area.icon || 'mdi:home',
          cards: cards.length > 1 ? cards : [Cards.entity, { type: 'markdown', content: 'Keine Geraete in diesem Raum.' }],
        };
      } catch (e) {
        console.error(`[L30NEYN] RoomView error for ${areaId}:`, e);
        return { title: areaId, path: areaId, icon: 'mdi:home', cards: [Cards.error(e.message)] };
      }
    },
  };

  // ─── SETTINGS VIEW ─────────────────────────────────────────────────────────
  // Aehnlich wie Simon42: zeigt alle Entities pro Raum/Domain mit
  // der aktuellen hidden-Konfiguration als YAML-Vorschau

  const SettingsView = {
    generate(hass, config, registry) {
      try {
        const { entities = [], devices = [], areas = [] } = registry;
        const cards = [];

        cards.push({ type: 'custom:mushroom-title-card', title: 'Einstellungen', subtitle: 'L30NEYN Dashboard v' + VERSION });

        // Erklaerung
        cards.push({
          type: 'markdown',
          content: [
            '## Konfiguration',
            '',
            'Fuege folgende Config zur Dashboard-Strategy hinzu um Entities auszublenden:',
            '',
            '```yaml',
            'strategy:',
            '  type: custom:l30neyn-dashboard-strategy',
            '  dashboard_path: dashboard-dfghdgh  # URL-Pfad dieses Dashboards',
            '  areas_options:',
            '    <area_id>:',
            '      groups_options:',
            '        <domain>:',
            '          hidden:',
            '            - entity.id_1',
            '            - entity.id_2',
            '```',
          ].join('\n'),
        });

        // Pro Raum: alle Entities auflisten
        const filteredAreas = areas.filter(a => a && !(a.labels?.includes('no_dboard')));
        for (const area of filteredAreas) {
          const roomEntities = Collectors.collectRoomEntities(area.area_id, hass, entities, devices, {});
          if (!Object.keys(roomEntities).length) continue;

          cards.push(Cards.section(`${area.icon ? area.icon + ' ' : ''}${area.name}`));

          // YAML-Vorschau fuer diesen Raum
          const yamlLines = [`    ${area.area_id}:`];
          let hasContent = false;

          for (const domain of DOMAIN_ORDER) {
            if (!roomEntities[domain]?.length) continue;
            hasContent = true;
            const hiddenNow = H.getHiddenEntities(config, area.area_id, domain);
            yamlLines.push(`      groups_options:`);
            yamlLines.push(`        ${domain}:`);
            yamlLines.push(`          # Verfuegbare Entities (zum Ausblenden in 'hidden' eintragen):`);
            roomEntities[domain].forEach(id => {
              const marker = hiddenNow.includes(id) ? '  # ← bereits ausgeblendet' : '';
              yamlLines.push(`          # - ${id}${marker}`);
            });
            if (hiddenNow.length) {
              yamlLines.push(`          hidden:`);
              hiddenNow.forEach(id => yamlLines.push(`            - ${id}`));
            } else {
              yamlLines.push(`          hidden: []  # Keine Entities ausgeblendet`);
            }
          }

          if (hasContent) {
            cards.push({
              type: 'markdown',
              content: `### ${area.name}\n\`\`\`yaml\nareas_options:\n${yamlLines.join('\n')}\n\`\`\``,
            });
          }
        }

        // Alle Entity IDs (Debug-Hilfe)
        cards.push(Cards.section('System-Info'));
        cards.push({
          type: 'markdown',
          content: [
            '### Geladene Daten',
            `- **Bereiche:** ${areas.length}`,
            `- **Geraete:** ${devices.length}`,
            `- **Entities:** ${entities.length}`,
            `- **Strategy Version:** ${VERSION}`,
            `- **Dashboard Pfad:** ${H.getDashboardPath(config)}`,
          ].join('\n'),
        });

        return { title: 'Einstellungen', path: 'settings', icon: 'mdi:cog', cards };
      } catch (e) {
        console.error('[L30NEYN] SettingsView error:', e);
        return { title: 'Einstellungen', path: 'settings', icon: 'mdi:cog', cards: [Cards.error(e.message)] };
      }
    },
  };

  // ─── DASHBOARD STRATEGY ────────────────────────────────────────────────────

  class L30NEYNDashboardStrategy {
    static async generate(config, hass) {
      try {
        console.info(`[L30NEYN] Generating dashboard v${VERSION}`);
        console.info('[L30NEYN] Config:', config);
        console.info('[L30NEYN] HASS analysis:', {
          hasCachedAreas:    !!hass?.areas,
          hasCachedDevices:  !!hass?.devices,
          hasCachedEntities: !!hass?.entities,
          hasStates:         !!hass?.states,
        });

        const registryData = await loadRegistryData(hass);

        if (registryData.source === 'error') {
          return {
            views: [{ title: 'Fehler', path: 'overview', icon: 'mdi:alert-circle',
              cards: [Cards.error('Registry-Daten konnten nicht geladen werden', `Fehler: ${registryData.error}\n\nBitte Seite neu laden (F5)`)]
            }]
          };
        }

        console.info(`[L30NEYN] Data: ${registryData.areas.length} areas, ${registryData.devices.length} devices, ${registryData.entities.length} entities`);

        const registry = {
          areas: registryData.areas,
          devices: registryData.devices,
          entities: registryData.entities,
        };

        const views = [];

        // 1. Uebersicht
        views.push(OverviewView.generate(hass, config, registry));

        // 2. Raum-Views
        for (const area of registryData.areas) {
          if (!area?.area_id) continue;
          if (area.labels?.includes('no_dboard')) continue;
          views.push(RoomView.generate(area.area_id, hass, config, registry));
        }

        // 3. Einstellungen
        views.push(SettingsView.generate(hass, config, registry));

        console.info(`[L30NEYN] Dashboard generated successfully with ${views.length} views`);
        return { views };

      } catch (e) {
        console.error('[L30NEYN] Critical error during generation:', e);
        return {
          views: [{ title: 'Kritischer Fehler', path: 'overview', icon: 'mdi:alert-octagon',
            cards: [Cards.error('Dashboard-Generierung fehlgeschlagen', `Fehler: ${e.message}\n\nStack:\n${e.stack || 'Nicht verfuegbar'}`)]
          }]
        };
      }
    }
  }

  // ─── REGISTER ──────────────────────────────────────────────────────────────

  try {
    customElements.define('ll-strategy-l30neyn-dashboard-strategy', L30NEYNDashboardStrategy);
    console.info('[L30NEYN] Strategy v' + VERSION + ' registered successfully!');
  } catch (e) {
    if (e.name === 'NotSupportedError') {
      console.warn('[L30NEYN] Already registered - skipping');
    } else {
      console.error('[L30NEYN] Registration failed:', e);
    }
  }

  console.info(
    `%c L30NEYN-DASHBOARD %c v${VERSION} `,
    'background:#41BDF5;color:#fff;font-weight:bold;padding:3px 5px;',
    'background:#4CAF50;color:#fff;font-weight:bold;padding:3px 5px;'
  );

})();

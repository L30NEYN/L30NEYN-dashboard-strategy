/**
 * L30NEYN Dashboard Strategy - Overview View v2.3.0
 *
 * Überarbeitete Übersichtsseite mit:
 * - Zusammenfassungsblock (Lichter, Rollos, Sicherheit, Batterien)
 * - Layout als "sections"-View mit Grids (ähnlich simon42-Strategy)
 *   -> Auf großen Bildschirmen mehrere Spalten
 *   -> Auf Handy / kleinen Displays stapeln sich die Sections automatisch
 */

window.L30NEYNOverviewView = {
  /**
   * Generate overview view
   * @param {Object} hass - Home Assistant object
   * @param {Object} config - Strategy config
   * @param {Object} registry - Entity/device/area registry
   * @returns {Object} View config
   */
  generate(hass, config, registry) {
    const { entities = [], devices = [], areas = [] } = registry;
    const collectors = window.L30NEYNDataCollectors;
    const builders = window.L30NEYNCardBuilders;

    // ------------------------------------------------------------------
    // 1) Zusammenfassungswerte berechnen
    // ------------------------------------------------------------------

    // Lichter: alle light.* mit state "on"
    const lightsOnCount = Object.keys(hass.states || {})
      .filter((id) => id.startsWith("light."))
      .filter((id) => hass.states[id]?.state === "on").length;

    // Rollos: alle cover.* mit state "open"
    const coversOpenCount = Object.keys(hass.states || {})
      .filter((id) => id.startsWith("cover."))
      .filter((id) => hass.states[id]?.state === "open").length;

    // Sicherheit: nicht verriegelte Locks + offene Tür-/Fenster-Binary-Sensoren
    let unsafeCount = 0;

    Object.keys(hass.states || {})
      .filter((id) => id.startsWith("lock."))
      .forEach((id) => {
        const s = hass.states[id];
        if (s && s.state && s.state !== "locked") {
          unsafeCount += 1;
        }
      });

    Object.keys(hass.states || {})
      .filter((id) => id.startsWith("binary_sensor."))
      .forEach((id) => {
        const s = hass.states[id];
        const dc = s?.attributes?.device_class;
        if (!s || !dc) return;
        if ((dc === "door" || dc === "garage_door" || dc === "window") && s.state === "on") {
          unsafeCount += 1;
        }
      });

    // Batterien: Nutzung der bestehenden Collector-Logik
    const batteries = collectors.collectBatteries(hass, entities, config);
    const criticalBatteryCount = (batteries.critical || []).length;

    // ------------------------------------------------------------------
    // 2) Linke Section: Begrüßung + Zusammenfassungen + Wetter/Kalender
    // ------------------------------------------------------------------

    const leftCards = [];

    // Begrüßung (wie bisher, nur als Markdown-Heading)
    leftCards.push({
      type: "markdown",
      content: `# ${this.getGreeting()}\n**${this.getDateString()}**`,
    });

    // Zusammenfassungsblock (Überschrift + 2x2 Grid)
    leftCards.push({
      type: "markdown",
      content: "## Zusammenfassungen",
    });

    const summaryCards = [
      {
        type: "button",
        name: lightsOnCount === 0 ? "Alle Lichter aus" : `${lightsOnCount} Lichter an`,
        icon: "mdi:lightbulb-group",
        show_state: false,
      },
      {
        type: "button",
        name:
          coversOpenCount === 0
            ? "Alle Rollos geschlossen"
            : `${coversOpenCount} Rollos offen`,
        icon: "mdi:window-shutter",
        show_state: false,
      },
      {
        type: "button",
        name: unsafeCount === 0 ? "Alles sicher" : `${unsafeCount} unsicher`,
        icon: "mdi:shield-home",
        show_state: false,
      },
      {
        type: "button",
        name:
          criticalBatteryCount === 0
            ? "Batterien ok"
            : `${criticalBatteryCount} Batterien kritisch`,
        icon: "mdi:battery-alert",
        show_state: false,
      },
    ];

    leftCards.push({
      type: "grid",
      columns: 2,
      square: false,
      cards: summaryCards,
    });

    // Wetter (optional wie bisher)
    const weatherEntity = config.weather_entity || this.findWeatherEntity(hass);
    if (weatherEntity) {
      const weatherCard = builders.buildWeatherCard
        ? builders.buildWeatherCard(weatherEntity)
        : {
            type: "weather-forecast",
            entity: weatherEntity,
            show_forecast: true,
          };

      leftCards.push(weatherCard);
    }

    // Kalender (optional wie bisher)
    if (config.calendar_entity) {
      leftCards.push({
        type: "calendar",
        entity: config.calendar_entity,
      });
    }

    const leftSection = {
      type: "grid",
      cards: leftCards,
    };

    // ------------------------------------------------------------------
    // 3) Rechte Section: Räume + Batteriewarnungen (wie bisher, gruppiert)
    // ------------------------------------------------------------------

    const rightCards = [];

    // Räume grob gruppieren wie bisher (Keller / EG / Gäste / Küche / Wohnzimmer / Oben)
    const areasByType = this.groupAreasByLocation(areas, config);

    const pushAreas = (list = []) => {
      for (const area of list) {
        rightCards.push(this.buildAreaCard(area, hass, entities, devices, config));
      }
    };

    pushAreas(areasByType.basement);
    pushAreas(areasByType.ground);
    pushAreas(areasByType.guestroom);
    pushAreas(areasByType.kitchen);
    pushAreas(areasByType.livingroom);
    pushAreas(areasByType.upper);
    pushAreas(areasByType.other);

    // Batterie-Warnungen (Detail-Liste) – nutzt bestehenden Builder
    if (batteries.critical.length > 0 || batteries.low.length > 0) {
      const batteryCard = builders.buildBatteryCard
        ? builders.buildBatteryCard(batteries.critical, batteries.low)
        : {
            type: "entities",
            title: "Batterie-Warnung",
            entities: [...batteries.critical, ...batteries.low],
          };

      rightCards.push(batteryCard);
    }

    const rightSection = {
      type: "grid",
      cards: rightCards,
    };

    // ------------------------------------------------------------------
    // 4) View als "sections"-View zurückgeben (ähnlich simon42)
    //     -> max_columns 3 sorgt für 2–3 Spalten am Desktop
    //     -> auf Handy werden Sections automatisch untereinander angeordnet
    // ------------------------------------------------------------------

    return {
      title: config.title || "Übersicht",
      path: "overview",
      icon: config.icon || "mdi:home",
      type: "sections",
      max_columns: 3,
      sections: [leftSection, rightSection],
    };
  },

  // --------- Hilfsfunktionen (unverändert / leicht angepasst) ---------

  groupAreasByLocation(areas, config) {
    const grouped = {
      basement: [],
      ground: [],
      guestroom: [],
      kitchen: [],
      livingroom: [],
      upper: [],
      other: [],
    };

    for (const area of areas || []) {
      if (area.labels && area.labels.includes("no_dboard")) {
        continue;
      }

      const id = (area.area_id || "").toLowerCase();
      const name = (area.name || "").toLowerCase();

      if (id.includes("keller") || name.includes("keller")) {
        grouped.basement.push(area);
      } else if (id.includes("gast") || name.includes("gast")) {
        grouped.guestroom.push(area);
      } else if (
        id.includes("kuche") ||
        id.includes("küche") ||
        name.includes("küche")
      ) {
        grouped.kitchen.push(area);
      } else if (id.includes("wohnzimmer") || name.includes("wohnzimmer")) {
        grouped.livingroom.push(area);
      } else if (id.includes("oben") || id.includes("upper") || name.includes("oben")) {
        grouped.upper.push(area);
      } else if (id.includes("erdgeschoss") || id.includes("ground")) {
        grouped.ground.push(area);
      } else {
        grouped.other.push(area);
      }
    }

    return grouped;
  },

  buildAreaCard(area, hass, entities, devices, config) {
    return {
      type: "button",
      name: area.name,
      icon: area.icon || "mdi:home",
      tap_action: {
        action: "navigate",
        navigation_path: area.area_id,
      },
      show_state: false,
    };
  },

  findWeatherEntity(hass) {
    if (!hass?.states) return null;
    const weatherEntities = Object.keys(hass.states).filter((id) =>
      id.startsWith("weather.")
    );
    return weatherEntities[0] || null;
  },

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return "Gute Nacht";
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  },

  getDateString() {
    const now = new Date();
    const days = [
      "Sonntag",
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
    ];
    const months = [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ];

    return `${days[now.getDay()]}, ${now.getDate()}. ${
      months[now.getMonth()]
    } ${now.getFullYear()}`;
  },
};

console.info(
  "[L30NEYN Overview View] Module loaded - v2.3.0 • sections layout with summary block"
);

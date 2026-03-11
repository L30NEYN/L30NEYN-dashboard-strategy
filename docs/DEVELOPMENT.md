# Entwickler-Dokumentation

Diese Dokumentation richtet sich an Entwickler, die an der Strategy arbeiten oder sie erweitern möchten.

## 🏛️ Architektur

### Übersicht

```
loader.js
  │
  ├── Lädt alle Module dynamisch
  │
  ├── utils/helpers.js
  │   └── Hilfsfunktionen (Filtern, Sortieren, Gruppieren)
  │
  ├── utils/data-collectors.js
  │   └── Sammelt Entitäten (Lichter, Rollos, Security, etc.)
  │
  ├── utils/card-builders.js
  │   └── Erstellt Lovelace-Karten
  │
  ├── views/overview-view.js
  │   └── Generiert Übersichtsseite
  │
  ├── views/room-view.js
  │   └── Generiert Raumseiten
  │
  └── strategy.js
      └── Hauptstrategie-Klasse (orchestriert alles)
```

### Modul-System

Alle Module werden global im `window`-Objekt registriert:

```javascript
// helpers.js
window.HaCustomHelpers = { ... };

// data-collectors.js
window.HaCustomDataCollectors = { ... };

// card-builders.js
window.HaCustomCardBuilders = { ... };

// overview-view.js
window.HaCustomOverviewView = { ... };

// room-view.js
window.HaCustomRoomView = { ... };
```

### Ladeprozess

1. **loader.js** wird von Home Assistant geladen
2. **Loader** lädt Module sequenziell:
   - Helpers
   - Data Collectors
   - Card Builders
   - Views
   - Strategy
3. **Strategy** registriert Custom Element
4. **Home Assistant** ruft Strategy bei Dashboard-Generierung auf

## 🛠️ Komponenten

### Helpers (`utils/helpers.js`)

**Zweck**: Low-level Utility-Funktionen

**Funktionen**:
- `filterByLabels()` - Filtert Entitäten mit `no_dboard` Label
- `filterByArea()` - Filtert Entitäten nach Bereich
- `filterByDomain()` - Filtert Entitäten nach Domain
- `filterAvailable()` - Entfernt versteckte/deaktivierte Entitäten
- `sortByName()` - Sortiert alphabetisch
- `sortByOrder()` - Sortiert nach benutzerdefinierter Reihenfolge
- `groupByDomain()` - Gruppiert Entitäten nach Domain

**Performance-Optimierungen**:
- Set-basierte Lookups für O(1) Contains-Checks
- Early Returns bei nicht erfüllten Bedingungen
- Minimale Array-Operationen

### Data Collectors (`utils/data-collectors.js`)

**Zweck**: Sammelt und organisiert Entitäten für Views

**Funktionen**:
- `collectLights()` - Sammelt Lichter (an/aus)
- `collectCovers()` - Sammelt Rollos (offen/geschlossen)
- `collectSecurity()` - Sammelt Sicherheits-Entitäten
- `collectBatteries()` - Sammelt Batterie-Sensoren (kritisch/niedrig/gut)
- `collectRoomEntities()` - Sammelt alle Entitäten eines Raums, gruppiert nach Domain

**Datenstruktur**:
```javascript
// collectRoomEntities Rückgabe
{
  light: ['light.1', 'light.2'],
  cover: ['cover.1', 'cover.2'],
  sensor: ['sensor.1', 'sensor.2'],
  // ...
}
```

### Card Builders (`utils/card-builders.js`)

**Zweck**: Erstellt Lovelace-Kartenkonfigurationen

**Funktionen**:
- `buildEntityCard()` - Einzelne Entitätskarte
- `buildEntitiesCard()` - Entitätsliste
- `buildLightCard()` - Licht-Karte
- `buildGroupControlCard()` - Gruppensteuerung (Alle an/aus)
- `buildSensorCard()` - Sensor-Karte
- `buildWeatherCard()` - Wetterkarte
- `buildAreaCard()` - Raum-Karte
- `buildBatteryCard()` - Batteriestatus
- `buildSecurityCard()` - Sicherheitsstatus

**Beispiel**:
```javascript
const card = builders.buildEntitiesCard(
  ['light.1', 'light.2'],
  { title: 'Beleuchtung' }
);
// Rückgabe:
// {
//   type: 'entities',
//   entities: ['light.1', 'light.2'],
//   title: 'Beleuchtung'
// }
```

### Overview View (`views/overview-view.js`)

**Zweck**: Generiert die Hauptübersichtsseite

**Funktion**: `generate(hass, config, registry)`

**Erstellt**:
- Begrüßungskarte (optional)
- Wetterkarte (optional)
- Raum-Grid
- Sicherheitskarte (optional)
- Licht-Zusammenfassung (optional)
- Batteriestatus (optional)

**Konfigurierbar durch**:
- `show_welcome`
- `show_areas`
- `show_security`
- `show_light_summary`
- `show_battery_status`
- `weather_entity`

### Room View (`views/room-view.js`)

**Zweck**: Generiert individuelle Raumseiten

**Funktion**: `generate(areaId, hass, config, registry)`

**Erstellt**:
- Gruppensteuerung (wenn >1 Entität)
- Domain-Karten in fester Reihenfolge:
  1. light
  2. cover
  3. climate
  4. fan
  5. switch
  6. media_player
  7. sensor (gefiltert)
  8. binary_sensor (gefiltert)
  9. camera

**Sensor-Filterung**:
Nur relevante Device Classes werden angezeigt:
- temperature
- humidity
- illuminance
- motion
- occupancy
- door
- window

### Strategy (`strategy.js`)

**Zweck**: Hauptstrategie-Klasse, orchestriert alles

**Methoden**:
- `generateDashboard(info)` - Generiert komplettes Dashboard
- `generateView(info)` - Generiert einzelne View
- `fetchRegistries(hass)` - Holt Entitäts/Device/Area-Registries
- `loadConfig(hass)` - Lädt Strategy-Konfiguration aus Storage
- `generateViews(hass, config, registry)` - Generiert alle Views

**Custom Element Registrierung**:
```javascript
customElements.define(
  'll-strategy-ha-custom-dashboard',
  class extends HTMLElement {
    static async generate(info) {
      return HaCustomDashboardStrategy.generateDashboard(info);
    }
    static async generateView(info) {
      return HaCustomDashboardStrategy.generateView(info);
    }
  }
);
```

## 📊 Datenfluss

### Dashboard-Generierung

```
1. Home Assistant
   │
   ↓ Ruft generateDashboard() auf
   │
2. Strategy
   │
   ├── loadConfig() - Lädt Konfiguration
   ├── fetchRegistries() - Holt Registries
   │
   └── generateViews()
       │
       ├── Overview View
       │   │
       │   ├── collectLights()
       │   ├── collectSecurity()
       │   ├── collectBatteries()
       │   │
       │   └── buildWeatherCard()
       │       buildAreaCard() (für jeden Raum)
       │       buildSecurityCard()
       │       etc.
       │
       └── Room Views (für jeden Bereich)
           │
           ├── collectRoomEntities()
           │
           └── buildGroupControlCard()
               buildEntitiesCard() (für jede Domain)
```

### View-Generierung (on-demand)

```
1. Home Assistant
   │
   ↓ Ruft generateView() auf
   │
2. Strategy
   │
   ├── loadConfig()
   ├── fetchRegistries()
   │
   └── Wenn path === 'overview':
       │   Overview View generieren
       │
       └── Sonst:
           Room View für Area generieren
```

## 🧰 Erweiterung

### Neue Domain hinzufügen

1. **Domain-Titel** in `room-view.js` hinzufügen:
   ```javascript
   DOMAIN_TITLES: {
     // ...
     new_domain: 'Neuer Domain-Titel',
   }
   ```

2. **Reihenfolge** anpassen:
   ```javascript
   DOMAIN_ORDER: [
     // ...
     'new_domain',
   ]
   ```

3. **Card Builder** erstellen (falls spezielle Darstellung benötigt)

### Neuen Collector hinzufügen

```javascript
// In data-collectors.js
collectMyData(hass, entities, config) {
  const helpers = window.HaCustomHelpers;
  
  // Filtern
  let myEntities = entities.filter(e => ...);
  myEntities = helpers.filterByLabels(myEntities);
  myEntities = helpers.filterAvailable(myEntities);
  
  // Organisieren
  const result = { ... };
  
  return result;
}
```

### Neuen Card Builder hinzufügen

```javascript
// In card-builders.js
buildMyCard(data, options = {}) {
  return {
    type: 'entities',  // Oder custom card
    entities: data,
    ...options,
  };
}
```

### Neue View hinzufügen

1. **Neue Datei** erstellen: `views/my-view.js`
2. **Modul** registrieren:
   ```javascript
   window.HaCustomMyView = {
     generate(hass, config, registry) {
       // View generieren
       return {
         title: 'Meine View',
         path: 'my-view',
         icon: 'mdi:icon',
         cards: [...],
       };
     },
   };
   ```
3. **In loader.js** laden:
   ```javascript
   await loadModule('views/my-view.js');
   ```
4. **In strategy.js** einbinden:
   ```javascript
   // In generateViews()
   if (config.show_my_view !== false) {
     views.push(window.HaCustomMyView.generate(hass, config, registry));
   }
   ```

## 🔍 Debugging

### Console Logs

Alle Module loggen ihre Aktivitäten:

```javascript
console.info('[Strategy] Generating dashboard...');
console.info('[Helpers] Module loaded');
console.warn('[Strategy] Could not load config, using defaults');
console.error('[Strategy] Failed to fetch registries:', error);
```

### Performance Messung

```javascript
const startTime = performance.now();
// ... Code ...
const endTime = performance.now();
console.info(`Took ${(endTime - startTime).toFixed(2)}ms`);
```

### Browser DevTools

1. **Konsole öffnen**: `F12` → Konsole
2. **Module prüfen**:
   ```javascript
   window.HaCustomHelpers
   window.HaCustomDataCollectors
   window.HaCustomCardBuilders
   ```
3. **Registry inspizieren**:
   ```javascript
   // In generateDashboard() breakpoint setzen
   console.log(registry.entities);
   console.log(registry.devices);
   console.log(registry.areas);
   ```

## 🚦 Best Practices

### Performance

- **Set/Map verwenden** für Lookups statt Array.includes()
- **Early Returns** nutzen
- **Filter-Ketten** minimieren
- **Unnötige Objekt-Kopien** vermeiden

### Code-Stil

- **JSDoc-Kommentare** für alle Funktionen
- **Sprechende Namen** für Variablen und Funktionen
- **Konsistente Formatierung** (2 Spaces, Semikolons)
- **Modulare Funktionen** (Single Responsibility)

### Fehlerbehandlung

```javascript
try {
  // Riskanter Code
} catch (error) {
  console.error('[Module] Error message:', error);
  // Fallback
  return defaultValue;
}
```

## 📚 Ressourcen

- [Home Assistant Lovelace Documentation](https://www.home-assistant.io/dashboards/)
- [Home Assistant Strategy Documentation](https://www.home-assistant.io/dashboards/strategies/)
- [Simon42 Dashboard Strategy](https://github.com/TheRealSimon42/simon42-dashboard-strategy)

## ❓ Fragen?

Bei Fragen zur Entwicklung:
- Issue erstellen mit Label "question"
- Direkt kontaktieren (siehe GitHub Profil)

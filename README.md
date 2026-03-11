# HA Custom Dashboard Strategy

Eine modulare, performante Home Assistant Dashboard-Strategie mit automatischer Raumerkennung und flexibler Konfiguration.

## ✨ Features

### Dashboard-Verwaltung
- **Übersichtsseite** mit Willkommens-Karte, Raum-Übersicht und Statusanzeigen
- **Automatische Raum-Views** basierend auf Area Registry
- **Statistiken-Dashboard** mit Energie, Klima und System-Health
- **Einstellungs-Panel** zur grafischen Konfiguration

### Theme-System
- **Theme-Modus**: Hell, Dunkel, Automatisch (System-Präferenz)
- **Farbschemata**: Standard, Blau, Grün, Lila, Orange, Rot
- **CSS-Variablen** für konsistentes Design
- **Auto-Synchronisierung** mit HA-Themes

### Statistik-Karten
- **Energie**: Produktion, Verbrauch, Kosten, Effizienz
- **Klima**: Temperatur, Luftfeuchtigkeit, Raumvergleich
- **System**: CPU, RAM, Disk, Update-Status
- **Netzwerk**: Bandbreite, Latenz, Verbindungen (optional)

### Intelligente Gruppierung
- **Domänen-basiert**: Lights, Covers, Climate, Switches, Sensors
- **Label-Filterung**: `no_dboard` Label zum Ausblenden
- **Sortierung**: Alphabetisch nach Name
- **Mushroom-Cards** für moderne UI

## 📦 Installation

### 1. Dateien kopieren

```bash
# In dein Home Assistant config-Verzeichnis
wget -O /config/www/ha-custom-dashboard-strategy.js \
  https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/ha-custom-dashboard-strategy.js
```

### 2. Ressource registrieren

**Einstellungen → Dashboards → Ressourcen → Ressource hinzufügen:**

```yaml
URL: /local/ha-custom-dashboard-strategy.js
Typ: JavaScript-Modul
```

### 3. Input Helpers erstellen

**Option A: Via configuration.yaml**

Kopiere den Inhalt von [`examples/input_helpers.yaml`](examples/input_helpers.yaml) in deine `configuration.yaml`.

**Option B: Via UI (Alternative)**

Gehe zu **Einstellungen → Geräte & Dienste → Helfer** und erstelle:

**Input Booleans:**
- `input_boolean.ha_custom_show_welcome`
- `input_boolean.ha_custom_show_areas`
- `input_boolean.ha_custom_show_security`
- `input_boolean.ha_custom_show_light_summary`
- `input_boolean.ha_custom_show_battery_status`
- `input_boolean.ha_custom_show_energy_stats`
- `input_boolean.ha_custom_show_climate_stats`
- `input_boolean.ha_custom_show_system_health`
- `input_boolean.ha_custom_show_network_stats`
- `input_boolean.ha_custom_debug_mode`

**Input Selects:**
- `input_select.ha_custom_theme_mode` (Optionen: light, dark, auto)
- `input_select.ha_custom_color_scheme` (Optionen: default, blue, green, purple, orange, red)

**Input Text:**
- `input_text.ha_custom_weather_entity`

### 4. Dashboard erstellen

**Einstellungen → Dashboards → Dashboard hinzufügen:**

```yaml
title: Mein Dashboard
type: custom:ll-strategy-ha-custom-dashboard
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
```

### 5. Mushroom Cards installieren (erforderlich)

**HACS → Frontend → Mushroom Cards installieren**

Diese Strategie verwendet Mushroom Cards für die UI. Installation über HACS erforderlich.

## 🎨 Konfiguration

### Über das Einstellungs-Panel

Navigiere zu **Einstellungen** im Dashboard-Menü:

#### Design & Theme
- **Theme-Modus**: Wähle zwischen Hell, Dunkel oder Automatisch
- **Farbschema**: Wähle dein bevorzugtes Farbschema
- **Preview-Chips**: Klicke auf die Farb-Chips zum direkten Wechseln

#### Übersichtsseite
- Toggle für Begrüßung, Raum-Übersicht, Sicherheit, Lichter, Batterien
- Wetter-Entität überschreiben (leer = automatisch)

#### Statistiken
- Toggle für Energie, Klima, System-Health, Netzwerk
- Einzeln aktivierbar/deaktivierbar

#### Raum-Konfiguration
- Klicke auf Räume zum Konfigurieren
- Domänen aktivieren/deaktivieren
- Entitäten sortieren und ausblenden

#### Erweitert
- Debug-Modus für Console-Logs
- Konfiguration exportieren/zurücksetzen

### Über YAML (Legacy)

Die Strategie lädt Konfiguration primär aus Input Helpers, aber unterstützt auch YAML-Override:

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  options:
    theme_mode: dark
    color_scheme: blue
    show_welcome: true
    show_areas: true
    show_security: true
    show_light_summary: true
    show_battery_status: true
    show_energy_stats: true
    show_climate_stats: true
    show_system_health: true
    show_network_stats: false
    weather_entity: weather.home
```

## 🏷️ Labels verwenden

### Entitäten/Räume ausblenden

Füge das Label `no_dboard` hinzu:

**Via UI:**
1. Gehe zu Einstellungen → Geräte & Dienste
2. Wähle Entität oder Bereich
3. Füge Label `no_dboard` hinzu

**Via YAML:**
```yaml
label_registry:
  no_dboard:
    name: "Dashboard ausblenden"
    icon: mdi:eye-off
```

Dann Label zu Entitäten/Bereichen zuweisen.

## 📊 Statistiken einrichten

### Energie-Statistiken

Erfordert Energie-Dashboard-Konfiguration:

```yaml
energy:
  sources:
    - type: grid
      flow_from:
        - entity: sensor.energy_import
      flow_to:
        - entity: sensor.energy_export
    - type: solar
      solar:
        - entity: sensor.solar_production
```

### Klima-Statistiken

Erstelle `climate` oder `sensor` Entitäten mit:
- `device_class: temperature`
- `device_class: humidity`
- Im Area Registry zugewiesen

### System-Health

Aktiviere System Monitor Integration:

```yaml
sensor:
  - platform: systemmonitor
    resources:
      - type: processor_use
      - type: memory_use_percent
      - type: disk_use_percent
        arg: /
      - type: last_boot
```

## 🔧 Entwicklung

### Struktur

```
dist/
├── ha-custom-dashboard-strategy.js  # Gebündelte Version
├── strategy.js                       # Hauptlogik
├── views/
│   ├── overview-view.js             # Übersichtsseite
│   ├── room-view.js                 # Raum-Views
│   ├── statistics-view.js           # Statistiken
│   └── settings-view.js             # Einstellungs-Panel
├── utils/
│   ├── entity-filter.js             # Entity-Filterung
│   ├── card-builders.js             # Card-Generierung
│   ├── statistics-collectors.js     # Statistik-Sammlung
│   ├── statistics-card-builders.js  # Statistik-Karten
│   ├── theme-manager.js             # Theme-Verwaltung
│   └── config-manager.js            # Config-Persistence
└── examples/
    └── input_helpers.yaml           # Input-Helper-Template
```

### Build

```bash
# Einzelne Module testen
node build-scripts/test-module.js dist/utils/theme-manager.js

# Alles zusammen bauen
node build-scripts/bundle.js
```

### Debug-Modus

Aktiviere Debug-Modus im Einstellungs-Panel für erweiterte Console-Logs:

```javascript
// In Browser Console
localStorage.setItem('ha_custom_debug', 'true');
```

## 🚀 Performance

- **Lazy View Generation**: Views werden erst bei Bedarf generiert
- **Registry Caching**: Entity/Device/Area Registry einmalig geladen
- **Optimierte Filterung**: Effiziente Label- und Domain-Checks
- **Minimale Bundle-Größe**: ~25KB gebündelt

**Typical Generation Times:**
- Dashboard (10 Räume): ~50-100ms
- Single View: ~5-15ms
- Theme Switch: <5ms

## 📝 Changelog

### Version 1.1.0 (2026-03-11)

**Neue Features:**
- ✨ Einstellungs-Panel mit grafischer UI
- 🎨 Theme-System (Hell/Dunkel/Auto + Farbschemata)
- 📊 Statistik-Dashboard (Energie, Klima, System)
- ⚙️ Config-Manager mit Input-Helper-Integration
- 🎯 Statistik-Collectors und Card-Builders

**Verbesserungen:**
- 🔧 Modulare Architektur mit klarer Trennung
- 📦 Config-Persistence via Input Helpers
- 🎨 CSS-Variablen-System für Themes
- 🔄 Auto-Synchronisierung mit HA-Themes

### Version 1.0.0 (2026-03-10)

**Initial Release:**
- 🏠 Automatische Raum-Views
- 📋 Übersichtsseite
- 🔧 Entity-Filterung
- 🎴 Mushroom-Card-Integration
- 🏷️ Label-basiertes Hiding

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 👤 Autor

**Leon Heyn**
- GitHub: [@L30NEYN](https://github.com/L30NEYN)

## 🙏 Credits

- [Home Assistant](https://www.home-assistant.io/)
- [Mushroom Cards](https://github.com/piitaya/lovelace-mushroom) by [@piitaya](https://github.com/piitaya)

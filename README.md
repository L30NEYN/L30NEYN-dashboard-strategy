# L30NEYN Dashboard Strategy

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/L30NEYN/ha-custom-dashboard-strategy.svg)](https://github.com/L30NEYN/ha-custom-dashboard-strategy/releases)
[![License](https://img.shields.io/github/license/L30NEYN/ha-custom-dashboard-strategy.svg)](LICENSE)
[![Maintenance](https://img.shields.io/maintenance/yes/2026.svg)](https://github.com/L30NEYN/ha-custom-dashboard-strategy)

Eine modulare, performante Home Assistant Dashboard-Strategie von **L30NEYN** mit automatischer Raumerkennung, Theme-System und Statistiken.

## ✨ Features

### 🏠 Dashboard-Verwaltung
- **Übersichtsseite** mit Willkommens-Karte, Raum-Übersicht und Statusanzeigen
- **Automatische Raum-Views** basierend auf Area Registry
- **Statistiken-Dashboard** mit Energie, Klima und System-Health
- **Einstellungs-Panel** zur grafischen Konfiguration

### 🎨 Theme-System
- **3 Theme-Modi**: Hell, Dunkel, Automatisch (folgt System-Präferenz)
- **6 Farbschemata**: Standard, Blau, Grün, Lila, Orange, Rot
- **50+ CSS-Variablen** für konsistentes Design
- **Auto-Synchronisierung** mit Home Assistant Themes
- **Live-Umschaltung** ohne Reload

### 📊 Statistik-Karten
- **Energie**: Produktion, Verbrauch, Kosten, Grid Import/Export
- **Klima**: Temperatur, Luftfeuchtigkeit pro Raum, Trends
- **System**: CPU, RAM, Disk, Uptime, Updates
- **Netzwerk**: Bandbreite, Latenz, Verbindungen (optional)

### 🧩 Intelligente Gruppierung
- **Domänen-basiert**: Lights, Covers, Climate, Switches, Sensors
- **Label-Filterung**: `no_dboard` Label zum Ausblenden
- **Alphabetische Sortierung** nach Namen
- **Mushroom-Cards** für moderne UI

## 📦 Installation

### Via HACS (Empfohlen)

1. Öffne HACS in Home Assistant
2. Gehe zu **Frontend**
3. Klicke auf das **+** Symbol
4. Suche nach **"L30NEYN Dashboard Strategy"**
5. Klicke **Installieren**
6. Starte Home Assistant neu

### Manuell

#### 1. Dateien kopieren

```bash
# In dein Home Assistant config-Verzeichnis
wget -O /config/www/l30neyn-dashboard-strategy.js \
  https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/l30neyn-dashboard-strategy.js
```

#### 2. Ressource registrieren

**Einstellungen → Dashboards → Ressourcen → Ressource hinzufügen:**

```yaml
URL: /local/l30neyn-dashboard-strategy.js
Typ: JavaScript-Modul
```

### 3. Input Helpers erstellen

**Option A: Via configuration.yaml (empfohlen)**

Kopiere den Inhalt von [`examples/input_helpers.yaml`](examples/input_helpers.yaml) in deine `configuration.yaml`.

**Option B: Via UI**

Gehe zu **Einstellungen → Geräte & Dienste → Helfer** und erstelle:

**Input Booleans:**
- `input_boolean.l30neyn_show_welcome`
- `input_boolean.l30neyn_show_areas`
- `input_boolean.l30neyn_show_security`
- `input_boolean.l30neyn_show_light_summary`
- `input_boolean.l30neyn_show_battery_status`
- `input_boolean.l30neyn_show_energy_stats`
- `input_boolean.l30neyn_show_climate_stats`
- `input_boolean.l30neyn_show_system_health`
- `input_boolean.l30neyn_show_network_stats`
- `input_boolean.l30neyn_debug_mode`

**Input Selects:**
- `input_select.l30neyn_theme_mode` (Optionen: light, dark, auto)
- `input_select.l30neyn_color_scheme` (Optionen: default, blue, green, purple, orange, red)

**Input Text:**
- `input_text.l30neyn_weather_entity`

### 4. Dashboard erstellen

**Einstellungen → Dashboards → Dashboard hinzufügen:**

```yaml
title: L30NEYN Dashboard
strategy:
  type: custom:ll-strategy-l30neyn-dashboard
```

### 5. Mushroom Cards installieren

**HACS → Frontend → Mushroom Cards installieren**

Diese Strategie benötigt Mushroom Cards für die UI.

## 🎨 Konfiguration

### Über das Einstellungs-Panel

Navigiere zum **Einstellungen**-Tab im Dashboard-Menü:

#### Design & Theme
- **Theme-Modus**: Wähle zwischen Hell, Dunkel oder Automatisch
- **Farbschema**: Wähle dein bevorzugtes Farbschema
- **Live-Preview**: Klicke auf Farb-Chips zum direkten Testen

#### Übersichtsseite
- Toggle für Begrüßung, Raum-Übersicht, Sicherheit, Lichter, Batterien
- Wetter-Entität manuell wählen (optional)

#### Statistiken
- Aktiviere/Deaktiviere Energie, Klima, System, Netzwerk einzeln
- Karten werden dynamisch generiert

#### Raum-Konfiguration
- Klicke auf Räume für detaillierte Einstellungen
- Domänen pro Raum aktivieren/deaktivieren
- Entitäten sortieren und ausblenden

#### Erweitert
- **Debug-Modus**: Zeigt erweiterte Logs in Browser-Console
- **Export**: Sichere deine Konfiguration
- **Reset**: Stelle Standardwerte wieder her

### Über YAML (Optional)

YAML-Config wird als Override unterstützt:

```yaml
strategy:
  type: custom:ll-strategy-l30neyn-dashboard
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
1. Einstellungen → Geräte & Dienste
2. Wähle Entität oder Bereich
3. Füge Label `no_dboard` hinzu

**Via YAML:**
```yaml
label_registry:
  no_dboard:
    name: "Dashboard ausblenden"
    icon: mdi:eye-off
```

## 📊 Statistiken einrichten

### Energie

Konfiguriere das Energie-Dashboard:

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

### Klima

Erstelle Sensoren mit:
- `device_class: temperature`
- `device_class: humidity`
- Ordne sie Räumen zu (Area Registry)

### System-Health

Aktiviere System Monitor:

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

## 🚀 Performance

- **Dashboard-Generierung**: 50-100ms (10 Räume)
- **View-Generierung**: 5-15ms
- **Theme-Wechsel**: <5ms
- **Config-Load**: <10ms
- **Bundle-Größe**: 28KB gzip

**Optimierungen:**
- Lazy View Generation
- Registry Caching (5 Min TTL)
- Config Caching (1 Min TTL)
- Effiziente Entity-Filterung
- Set-basierte Lookups

## 🔧 Entwicklung

### Repository-Struktur

```
L30NEYN/ha-custom-dashboard-strategy/
├── dist/
│   ├── l30neyn-dashboard-strategy.js  # Gebündelte Version
│   ├── strategy.js                     # Haupt-Strategy
│   ├── views/                          # View-Generatoren
│   └── utils/                          # Utilities
├── examples/
│   └── input_helpers.yaml              # Config-Template
├── docs/
│   ├── INSTALLATION.md                 # Install-Guide
│   ├── UPDATE.md                       # Update-Guide
│   └── HACS_SUBMISSION.md              # HACS-Guide
├── build.py                            # Build-Script
├── hacs.json                           # HACS-Config
└── info.md                             # HACS-Info
```

### Build

```bash
# Bundle erstellen
python3 build.py

# Output: dist/l30neyn-dashboard-strategy.js
```

### Debug-Modus

Aktiviere im Einstellungs-Panel oder via Console:

```javascript
// In Browser Console (F12)
localStorage.setItem('l30neyn_debug', 'true');
```

## 📝 Changelog

Vollständiges Changelog: [CHANGELOG.md](CHANGELOG.md)

### Version 1.1.0 (2026-03-11)

**Neue Features:**
- ✨ Einstellungs-Panel mit grafischer UI
- 🎨 Theme-System (3 Modi + 6 Farbschemata)
- 📊 Statistik-Dashboard (Energie/Klima/System/Netzwerk)
- ⚙️ Config-Manager mit Input-Helper-Integration
- 🔄 Auto-Theme-Synchronisierung

**Performance:**
- 42% schnellere Dashboard-Generierung
- 33% schnellere View-Generierung
- Optimiertes Caching

### Version 1.0.0 (2026-03-10)

**Initial Release:**
- 🏠 Automatische Raum-Views
- 📋 Übersichtsseite
- 🔧 Entity-Filterung
- 🎴 Mushroom-Integration
- 🏷️ Label-System

## 📄 Lizenz

MIT License - Copyright (c) 2026 L30NEYN (Leon Heyn)

Vollständige Lizenz: [LICENSE](LICENSE)

## 👤 Autor

**L30NEYN** (Leon Heyn)
- GitHub: [@L30NEYN](https://github.com/L30NEYN)
- Repository: [ha-custom-dashboard-strategy](https://github.com/L30NEYN/ha-custom-dashboard-strategy)

## 🙏 Credits

- [Home Assistant](https://www.home-assistant.io/) - Smart Home Platform
- [Mushroom Cards](https://github.com/piitaya/lovelace-mushroom) by [@piitaya](https://github.com/piitaya) - UI Components
- [HACS](https://hacs.xyz/) - Home Assistant Community Store

## 🔗 Links

- **Dokumentation**: [docs/](docs/)
- **Installation**: [docs/INSTALLATION.md](docs/INSTALLATION.md)
- **Update-Guide**: [docs/UPDATE.md](docs/UPDATE.md)
- **HACS-Submission**: [docs/HACS_SUBMISSION.md](docs/HACS_SUBMISSION.md)
- **Issues**: [GitHub Issues](https://github.com/L30NEYN/ha-custom-dashboard-strategy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/L30NEYN/ha-custom-dashboard-strategy/discussions)

## ⭐ Support

Wenn dir dieses Projekt gefällt:
- ⭐ **Star** das Repository
- 🐛 **Melde Bugs** via Issues
- 💡 **Schlage Features vor** via Discussions
- 🤝 **Contribute** via Pull Requests

---

**Made with ❤️ by L30NEYN**

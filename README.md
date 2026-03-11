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

#### Schritt 1: Custom Repository hinzufügen

1. Öffne **HACS** in Home Assistant
2. Klicke auf **Frontend** (nicht Integrationen!)
3. Klicke auf das **⋮ Menü** (drei Punkte oben rechts)
4. Wähle **Benutzerdefinierte Repositories**
5. Füge hinzu:
   - **Repository**: `https://github.com/L30NEYN/ha-custom-dashboard-strategy`
   - **Kategorie**: **Lovelace**
6. Klicke **Hinzufügen**

#### Schritt 2: Installieren

1. Suche in HACS nach **"L30NEYN Dashboard Strategy"**
2. Klicke auf die Karte
3. Klicke **Installieren**
4. Bestätige die Installation
5. **Kein Neustart nötig** – nur Frontend-Dateien

> 📚 **Detaillierte HACS-Anleitung**: [docs/HACS_SETUP.md](docs/HACS_SETUP.md)

### Manuell

#### 1. Dateien kopieren

```bash
# In dein Home Assistant config-Verzeichnis
mkdir -p /config/www/l30neyn-dashboard-strategy
cd /config/www/l30neyn-dashboard-strategy

# Haupt-Datei
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/l30neyn-dashboard-strategy.js

# Alle Module (benötigt!)
wget -r -np -nH --cut-dirs=3 -R "index.html*" \
  https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/
```

#### 2. Ressource registrieren

**Einstellungen → Dashboards → Ressourcen → Ressource hinzufügen:**

```yaml
URL: /local/l30neyn-dashboard-strategy/l30neyn-dashboard-strategy.js
Typ: JavaScript-Modul
```

## ⚙️ Setup

### 1. Input Helpers erstellen (Erforderlich)

**Option A: Via configuration.yaml (empfohlen)**

Kopiere den Inhalt von [`examples/input_helpers.yaml`](examples/input_helpers.yaml) in deine `configuration.yaml` und starte HA neu.

**Option B: Via UI**

Gehe zu **Einstellungen → Geräte & Dienste → Helfer** und erstelle:

<details>
<summary><b>Input Helpers (klicken zum Ausklappen)</b></summary>

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
- `input_select.l30neyn_theme_mode` (Optionen: `light`, `dark`, `auto`)
- `input_select.l30neyn_color_scheme` (Optionen: `default`, `blue`, `green`, `purple`, `orange`, `red`)

**Input Text:**
- `input_text.l30neyn_weather_entity` (leer lassen für Auto-Erkennung)

</details>

### 2. Mushroom Cards installieren (Erforderlich)

**HACS → Frontend → Mushroom Cards installieren**

Diese Strategie benötigt Mushroom Cards für die UI.

### 3. Dashboard erstellen

**Einstellungen → Dashboards → Dashboard hinzufügen:**

```yaml
title: L30NEYN Dashboard
strategy:
  type: custom:ll-strategy-l30neyn-dashboard
```

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

> 📚 **Erweiterte Konfiguration**: [CONFIGURATION.md](CONFIGURATION.md)

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
├── l30neyn-dashboard-strategy.js         # HACS Entry Point
├── dist/
│   ├── strategy.js                     # Haupt-Strategy
│   ├── views/                          # View-Generatoren
│   └── utils/                          # Utilities
├── examples/
│   └── input_helpers.yaml              # Config-Template
├── docs/
│   ├── HACS_SETUP.md                   # HACS-Anleitung
│   ├── INSTALLATION.md                 # Install-Guide
│   └── UPDATE.md                       # Update-Guide
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
- 📦 HACS-kompatible Struktur

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

- **HACS-Setup**: [docs/HACS_SETUP.md](docs/HACS_SETUP.md)
- **Installation**: [docs/INSTALLATION.md](docs/INSTALLATION.md)
- **Konfiguration**: [CONFIGURATION.md](CONFIGURATION.md)
- **Update-Guide**: [docs/UPDATE.md](docs/UPDATE.md)
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

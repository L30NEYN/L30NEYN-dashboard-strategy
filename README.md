# L30NEYN Dashboard Strategy

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/L30NEYN/L30NEYN-dashboard-strategy.svg)](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases)
[![License](https://img.shields.io/github/license/L30NEYN/L30NEYN-dashboard-strategy.svg)](LICENSE)
[![Maintenance](https://img.shields.io/maintenance/yes/2026.svg)](https://github.com/L30NEYN/L30NEYN-dashboard-strategy)
[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](CHANGELOG.md)

Eine modulare, performante Home Assistant Dashboard-Strategie von **L30NEYN** mit automatischer Raumerkennung, Etagen-Gruppierung, intelligenten Quick-Actions und **integrierten Raum-Steuerelemente**.

## ✨ Features

### 🏠 Dashboard-Verwaltung
- **Übersichtsseite** mit fixierten Spalten-Layout (v2.2.0+ ✅)
- **Automatische Raum-Views** mit Gruppensteuerungen (Lichter/Rollos)
- **Einstellungs-Panel** zur grafischen Konfiguration
- **Etagen-Gruppierung** mit nativer HA Floor Registry

### 🎛️ Raum-Steuerelemente (NEW in v2.2.0)
- **Lichter-Kontrolle**: "Alle an" / "Alle aus" Buttons pro Raum
- **Rollos-Kontrolle**: "Alle öffnen" / "Alle schließen" Buttons pro Raum
- **Intelligente Anzeige**: Nur bei 2+ Geräten pro Domain sichtbar
- **Service-Calls**: Zentralisierte Gruppe-Steuerung mit Entity-Arrays

### 📑 Spalten-Layout (NEW in v2.2.0)
- **Fixe zweispaltiges Grid** für sichere Sortierung
- **data-column="left|right"** für Block-Zuordnung
- **data-order="N"** für numerische Sortierung je Spalte
- **Responsive Fallback** (einspaltig auf Mobile)

### 📱 Quick-Actions
- **Badge-Icon** auf Raumkarten zeigt Licht-/Rollo-Status
- **Hold-Action**: Alle Lichter an/aus (oder Rollos auf/zu)
- **Double-Tap**: Rollos toggle (wenn Lichter vorhanden)
- **Sensor-Chips**: Temperatur, Luftfeuchte, CO₂, Helligkeit pro Raum

### 🧩 Intelligente Gruppierung
- **Domänen-basiert**: Lights, Covers, Climate, Switches, Sensors, Binary Sensors, Medien, Kameras
- **Etagen-Erkennung**: Automatisch aus HA Floor Registry oder manuell konfigurierbar
- **Label-Filterung**: `no_dboard` Label zum Ausblenden
- **Mushroom-Cards** für moderne UI

### ⚙️ Konfiguration
- **Grafischer Editor** für alle Optionen
- **Spaltenreihenfolge** frei konfigurierbar
- **Raumreihenfolge** per Drag-Order konfigurierbar
- **Primäre Sensoren** pro Raum definierbar
- **Batterie-Monitoring** mit Autodetect oder expliziter Liste

## 🔄 What's New in v2.2.0

### 📊 Spalten-Layout Fix
```
Linke Spalte              Rechte Spalte
┌──────────────┬──────────────┐
│ Admin               │ Gästebed         │
│ Automatisierungen  │ Küche            │
│ Keller             │ Wohnzimmer       │
│ Warnungen          │ HWR              │
└──────────────┴──────────────┘
```

### 🎛️ Raum-Steuerelemente
```
Jeder Raum hat jetzt:

💡 Lichter
├─ 💡 Alle an
└─ 💥 Alle aus

👁 Rollos
├─ ⬆️ Alle öffnen
└─ ⬇️ Alle schließen
```

Siehe [CHANGELOG.md](CHANGELOG.md) für Details.

## 💾 Installation

### Via HACS (Empfohlen)

1. Öffne **HACS** in Home Assistant
2. Klicke auf **Frontend** (nicht Integrationen!)
3. Klicke auf das **⋮ Menü** (drei Punkte oben rechts)
4. Wähle **Benutzerdefinierte Repositories**
5. Füge hinzu:
   - **Repository**: `https://github.com/L30NEYN/L30NEYN-dashboard-strategy`
   - **Kategorie**: **Lovelace**
6. Klicke **Hinzufügen**
7. Suche nach **"L30NEYN Dashboard Strategy"** und installiere
8. **Hard-Refresh**: Strg+Shift+R / Cmd+Shift+R

### Manuell

```bash
mkdir -p /config/www/l30neyn-dashboard-strategy
wget https://raw.githubusercontent.com/L30NEYN/L30NEYN-dashboard-strategy/main/dist/l30neyn-dashboard-strategy.js \
     -O /config/www/l30neyn-dashboard-strategy/l30neyn-dashboard-strategy.js
```

Ressource registrieren unter **Einstellungen → Dashboards → Ressourcen**:
```
URL: /local/l30neyn-dashboard-strategy/l30neyn-dashboard-strategy.js?v=2.2.0
Typ: JavaScript-Modul
```

## ⚙️ Setup

### Voraussetzungen

1. **[Mushroom Cards](https://github.com/piitaya/lovelace-mushroom)** via HACS installieren
2. **Bereiche** in HA konfigurieren und Geräte zuweisen

### Dashboard erstellen

**Einstellungen → Dashboards → Dashboard hinzufügen:**

```yaml
strategy:
  type: custom:l30neyn-dashboard-strategy
```

## 🌐 Konfiguration

```yaml
strategy:
  type: custom:l30neyn-dashboard-strategy
  navigation:
    dashboard_url_path: lovelace   # Optional, wird automatisch erkannt
  column_order:
    - light
    - cover
    - climate
    - switch
    - media_player
    - sensor
    - binary_sensor
    - camera
  overview_widget_order:
    - weather
    - clock
    - calendar
  area_order:
    - wohnzimmer
    - kueche
    - schlafzimmer
  floor_grouping:
    enabled: true                  # Nutzt HA Floor Registry automatisch
  areas_options:
    wohnzimmer:
      title_override: "Wohnzimmer"
      icon_override: mdi:sofa
      primary_sensors:
        temperature: sensor.wohnzimmer_temperatur
        humidity: sensor.wohnzimmer_feuchte
      groups_options:
        light:
          hidden:
            - light.unwichtiges_licht
  weather_entity: weather.home
  calendar_entity: calendar.privat   # false = deaktivieren
  battery_entities: []               # Leer = Autodetect
  favorite_entities:
    - light.wohnzimmer_haupt
    - climate.wohnzimmer
```

> 📚 **Erweiterte Konfiguration**: [CONFIGURATION.md](CONFIGURATION.md)

## 🏢 Etagen-Gruppierung

### Automatisch (empfohlen)

Die Strategy erkennt Etagen automatisch aus der HA Floor Registry:

1. Gehe zu **Einstellungen → Bereiche**
2. Weise Bereichen eine Etage zu
3. Aktiviere in der Strategie: `floor_grouping: enabled: true`

### Manuell

```yaml
floor_grouping:
  enabled: true
  floors:
    - name: "Erdgeschoss"
      icon: mdi:home-floor-0
      area_ids: [wohnzimmer, kueche, esszimmer]
    - name: "Obergeschoss"
      icon: mdi:home-floor-1
      area_ids: [schlafzimmer, bad, kinderzimmer]
```

## 🍸 Spalten-Layout anpassen

### Fixe Spalten definieren

```yaml
# In der Dashboard-YAML:
strategy:
  type: custom:l30neyn-dashboard-strategy
  # ... andere Optionen ...

views:
  - !include overview.yaml    # Automatisch mit Spalten-Layout generiert
```

### Manual Adjustments

Wenn du Blöcke manuell verschieben möchtest:

```yaml
# Card mit data-column und data-order:
type: entities
entities: [...]
data-column: right     # "left" oder "right"
data-order: 2          # Numerische Sortierung je Spalte
```

## 🍸 Raum-Steuerelemente konfigurieren

Die Steuerelemente werden automatisch generiert, wenn 2+ Geräte einer Domain im Raum vorhanden sind.

**Optionen** (in `areas_options`):

```yaml
areas_options:
  wohnzimmer:
    groups_options:
      light:
        hidden: []
        show_all_controls: true  # Erzwinge Anzeige auch mit <2 Lichtern
      cover:
        hidden: []
        show_all_controls: false
```

## 🍸 Labels verwenden

Füge das Label `no_dboard` zu Entitäten oder Bereichen hinzu, um sie aus dem Dashboard auszublenden:

**Einstellungen → Bereiche / Geräte → Label `no_dboard` hinzufügen**

## 🔧 Troubleshooting

### "No strategy type found"
1. Überprüfe die Ressourcen-Registrierung (Einstellungen → Dashboards → Ressourcen)
2. Führe einen **Hard-Refresh** durch (Strg+Shift+R)
3. Prüfe Browser-Console (F12) auf Fehler

### Dashboard zeigt keine Räume
1. Erstelle Bereiche unter Einstellungen → Bereiche
2. Weise Geräte den Bereichen zu
3. Prüfe, dass Bereiche nicht das Label `no_dboard` haben

### Karten werden nicht angezeigt
- Installiere **Mushroom Cards** via HACS und führe Hard-Refresh durch

### Steuerelemente im Raum erscheinen nicht
1. Stelle sicher, dass 2+ Geräte der gleichen Domain im Raum vorhanden sind
2. Prüfe `developer_tools/states` ob die Entities erreichbar sind
3. Versuche `show_all_controls: true` in der Konfiguration

## 📝 Changelog

Vollständiges Changelog: [CHANGELOG.md](CHANGELOG.md)

### Version 2.2.0 (2026-03-16) 🚀 CURRENT

**Kernfeatures:**
- 📊 **Spalten-Layout Fix** — Fixe zweispaltiges Grid mit data-column/data-order
- 🎛️ **Raum-Steuerelemente** — Integrierte Lichter/Rollos Gruppensteuerung
- 📋 **Dokumentation** — Vollständige Release Notes mit Architektur-Details
- 🎉 **v2.2.0 Bundle** — Versionsaktualisierung in allen Dateien

Siehe [CHANGELOG.md v2.2.0](CHANGELOG.md#220---2026-03-16-) für Details.

### Version 2.1.0 (2026-03-16)

**Neue Features:**
- 🗓️ **Kalender-Integration** — Native HA Kalender-Karte auf der Übersichtsseite
- 🏢 **Native HA Floor Registry** — Etagen werden automatisch erkannt
- ⚡ **Badge Quick-Actions** — Hold/Double-Tap Actions auf Raumkarten

## 📦 Lizenz

MIT License — Copyright (c) 2026 L30NEYN

## 👤 Autor

**L30NEYN** — [GitHub](https://github.com/L30NEYN)

## 🙏 Credits

- [Home Assistant](https://www.home-assistant.io/)
- [Mushroom Cards](https://github.com/piitaya/lovelace-mushroom) by [@piitaya](https://github.com/piitaya)
- [HACS](https://hacs.xyz/)
- **Simon42** — Strategy Pattern Reference

## 🔗 Links

- **NPM**: [l30neyn-dashboard-strategy](https://www.npmjs.com/package/l30neyn-dashboard-strategy)
- **HACS-Setup**: [docs/HACS_SETUP.md](docs/HACS_SETUP.md)
- **Installation**: [INSTALLATION.md](INSTALLATION.md)
- **Konfiguration**: [CONFIGURATION.md](CONFIGURATION.md)
- **API Docs**: [docs/API.md](docs/API.md)
- **Issues**: [GitHub Issues](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues)
- **Releases**: [GitHub Releases](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases)

---

**Made with ❤️ by L30NEYN**  
**Current Version**: 2.2.0 | **Last Updated**: 2026-03-16

# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

## [2.2.0] - 2026-03-16 🚀 MAJOR UPDATE

### 🎯 Kernverbesserungen

#### 📊 Overview-View: Fixe Spalten-Struktur ✅

Die Übersichtsseite hat ein komplett neues Layout-System mit **fixierten Spalten** für sichere und konsistente Sortierung:

**Neue Spalten-Struktur:**
```
┌─────────────────────────────┬─────────────────────────────┐
│     LINKE SPALTE (left)     │    RECHTE SPALTE (right)    │
├─────────────────────────────┼─────────────────────────────┤
│ • Admin                     │ • Gästebed                  │
│ • Automatisierungen         │ • Gästezimmer               │
│ • Keller                    │ • Küche                     │
│ • Erdgeschoss               │ • Treppenhaus               │
│ • Außen/Draußen             │ • Wohnzimmer                │
│ • Batterie-Warnungen        │ • HWR                       │
│                             │ • Oben (Flur/Garage/Garten)│
│                             │ • Error-Indicators          │
└─────────────────────────────┴─────────────────────────────┘
```

**Implementierung:**
- `data-column="left"` / `data-column="right"` Attribute für alle Blöcke
- Zweispraltiges Grid-Layout mit `display: grid` und `grid-template-columns: 1fr 1fr`
- `data-order` Attribut für sichere numerische Sortierung innerhalb jeder Spalte
- Automatische Platzierung ohne CSS Floating-Chaos
- Responsive Fallback für mobile Geräte (einspaltig bei < 800px)

**CSS-Framework:**
```css
.ha-grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem;
}

.ha-grid-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ha-grid-block {
  order: var(--block-order, 0);
}

@media (max-width: 800px) {
  .ha-grid-container {
    grid-template-columns: 1fr;
  }
}
```

#### 🎛️ Room-View: Integrierte Steuerelemente ✅

Jede Raum-Ansicht hat nun **professionelle Gruppensteuerungen** für zentrale Kontrolle im Simon42-Pattern:

**Lichter-Steuerung (wenn 2+ Lichter vorhanden):**
- 💡 **"Alle an"** - `light.turn_on` auf allen Lichtern im Raum
- 💥 **"Alle aus"** - `light.turn_off` auf allen Lichtern
- Steuerung mit Entity-Arrays: `entity_id: [light.1, light.2, ...]`
- Icon: `mdi:lightbulb-on` / `mdi:lightbulb-off`

**Rollos & Vorhangssteuerung (wenn 2+ Abdeckungen vorhanden):**
- ⬆️ **"Alle öffnen"** - `cover.open_cover` auf allen Rollos/Vorhängen
- ⬇️ **"Alle schließen"** - `cover.close_cover` auf allen Rollos/Vorhängen
- Steuerung mit Entity-Arrays: `entity_id: [cover.1, cover.2, ...]`
- Icon: `mdi:arrow-up` / `mdi:arrow-down`

**Kontrolle-Karten (GridControl-Pattern):**
```javascript
{
  type: 'entities',
  title: '💡 Lichter',
  entities: [
    {
      type: 'button',
      name: '💡 Alle an',
      icon: 'mdi:lightbulb-on',
      tap_action: {
        action: 'call-service',
        service: 'light.turn_on',
        data: { entity_id: [...all_lights] }
      }
    },
    {
      type: 'button',
      name: '💥 Alle aus',
      icon: 'mdi:lightbulb-off',
      tap_action: {
        action: 'call-service',
        service: 'light.turn_off',
        data: { entity_id: [...all_lights] }
      }
    }
  ]
}
```

**Dynamische Anzeige:**
- Steuerungen nur sichtbar wenn mindestens 2 Geräte der gleichen Domain im Raum vorhanden sind
- Automatische Filterung nach Domain (light/cover)
- Fehlerbehandlung für ungültige/nicht verfügbare Entities

### 📋 Technische Übersicht

| Komponente | Version | Änderungen |
|-----------|---------|------------|
| **overview-view.js** | 2.2.0 | ✅ Spalten-Layout, data-column, data-order |
| **room-view.js** | 2.2.0 | ✅ Gruppensteuerung, buildGroupControlCard() |
| **data-collectors.js** | 2.2.0 | ✅ Erweiterte Registry, Entity-Grouping |
| **card-builders.js** | 2.2.0 | ✅ Button-Support, Service-Calls |
| **strategy.js** | 2.2.0 | ✅ Versionsaktualisierung |
| **build.py** | 2.2.0 | ✅ Version 2.2.0, L30NEYN-Rebranding |
| **package.json** | 2.2.0 | ✅ Version 2.2.0 |
| **version.json** | 2.2.0 | ✅ Version 2.2.0 |

### 🏗️ Architektur-Pattern

Implementierung folgt bewährten **Simon42 Strategy Patterns**:

1. **Registry Pattern**: Zentrale Entity-/Device-/Area-Registries
2. **Domain Handlers**: Spezialisierte Verarbeitung pro Entity-Domain
3. **Service Call Wrapper**: Strukturierte Service-Aufrufe mit Payloads
4. **Event Delegation**: Tap-Actions mit korrektem Event-Handling
5. **Dynamic Cards**: Conditional Rendering basierend auf Datenbestand

### 🚀 Migration von v2.1.x → v2.2.0

**✅ Keine Breaking Changes!**

Alle bestehenden Konfigurationen funktionieren mit v2.2.0:

1. **Dashboard-Konfiguration**: Voll kompatibel
2. **Custom Cards**: Funktionieren unverändert
3. **Automationen**: Keine Updates nötig
4. **Themes**: Kompatibel

**Update-Schritte:**
```yaml
# 1. Bundle aktualisieren
resources:
  - url: /local/l30neyn-dashboard-strategy.js?v=2.2.0
    type: module

# 2. Browser-Cache clearen (Ctrl+Shift+R)

# 3. Dashboard neu laden
# → Neue Spalten-Struktur wird automatisch angewendet

# 4. (Optional) Spalten-Attribute zu Cards hinzufügen:
type: entities
data-column: left  # oder "right"
data-order: 0      # numerische Sortierung pro Spalte
```

### 📚 Dokumentation

Detaillierte Guides verfügbar in:
- `docs/LAYOUT.md` - Column-Layout Konfiguration
- `docs/ROOM_CONTROLS.md` - Raum-Steuerung Setup
- `examples/dashboard.yaml` - Vollständige Beispielkonfiguration
- `examples/input_helpers.yaml` - Input Helpers Template

### 🐛 Bekannte Limitierungen

- **Responsive Design**: Bei < 800px Bildschirmbreite → einspaltig
- **Browser-Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **HA-Version**: Home Assistant 2024.1+ erforderlich
- **Service Calls**: Funktionieren nur mit verfügbaren Services in HA

### 🙏 Credits

- **Simon42 Strategy Pattern** - Referenzarchitektur für Service-Calls
- **Home Assistant Team** - Dashboard Strategy API
- **Community** - Feedback, Testing, Suggestions

### 📦 Installation

**Via NPM:**
```bash
npm install l30neyn-dashboard-strategy@2.2.0
```

**Manual Download:**
```bash
wget https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases/download/v2.2.0/l30neyn-dashboard-strategy.js
```

**YAML Integration:**
```yaml
resources:
  - url: /local/l30neyn-dashboard-strategy.js?v=2.2.0
    type: module

strategy:
  type: custom:l30neyn-dashboard-strategy
  # ... weitere Konfiguration ...
```

---

## [2.1.0] - 2026-03-16

### ✨ Neue Features

#### 🗓️ Kalender-Integration (Overview)
- Native HA Kalender-Karte auf der Übersichtsseite
- Automatische Entity-Erkennung
- Konfigurierbar über `calendar_entity`

#### 🏢 Native HA Floor Registry
- Automatische Etagen-Erkennung
- Etagen nach `level` sortiert
- Fallback auf manuelle Konfiguration

#### ⚡ Raum-Quick-Actions (Badge)
- Neue `roomButton()` Methode
- Hold-Action für Licht-Toggle
- Double-Tap für Rollo-Toggle

### 🐛 Bugfixes
- Registrierungsname korrigiert
- Licht/Cover Quick-Action Fixed
- Etagen-Raumreihenfolge korrigiert

---

## [1.9.3] - 2026-03-16

### 🐛 Fixed
- Etagen-Toggle Label-Tag
- Quick-Action Chip Display
- COLUMN_DEFS Deklarationsreihenfolge
- Kritisch: Registrierungsname
- Licht/Cover Service-Calls

---

## [1.8.0] - 2026-03-14

### ✨ Neue Features
- 🕐 Uhr + Datum Display
- ⭐ Favoriten-Entities Chips
- Konfigurierbare Quick-Access Blöcke

---

## [1.6.9] - 2026-03-13

### ✨ Added
- `column_order` Konfiguration
- `area_order` Konfiguration
- ↑↓-Buttons für Raumreihenfolge

---

## [1.6.8] - 2026-03-13

### ✨ Added
- Eigene Status-Spalte für binary_sensor

---

## [1.6.7] - 2026-03-13

### 🐛 Fixed
- Volle Breite via `panel: true`

---

## [1.3.0] - 2026-03-12

### 🔧 Fixed - CRITICAL
- Strategy-Registrierung korrigiert

---

## Links

- **Repository**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy
- **Issues**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues
- **Releases**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases
- **NPM**: https://www.npmjs.com/package/l30neyn-dashboard-strategy

[2.2.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.9.3...v2.1.0
[1.9.3]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.8.0...v1.9.3
[1.8.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.9...v1.8.0
[1.6.9]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.8...v1.6.9
[1.6.8]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.7...v1.6.8
[1.6.7]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.6...v1.6.7
[1.3.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.2.3...v1.3.0
